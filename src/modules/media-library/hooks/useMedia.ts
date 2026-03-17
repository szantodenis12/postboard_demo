import { useState, useEffect, useCallback, useRef } from 'react'

export interface MediaFile {
  filename: string
  originalName?: string
  size: number
  url: string
  uploadedAt: string
  clientId: string
  mimeType?: string
  // Metadata
  tags: string[]
  description: string
}

interface MediaMeta {
  tags: string[]
  description: string
  originalName?: string
}

const API = ''

export function useMedia(clientFilter: string | null) {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const metaRef = useRef<Record<string, MediaMeta>>({})

  const fetchMeta = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/media/meta`)
      if (res.ok) {
        metaRef.current = await res.json()
      }
    } catch { /* ignore */ }
  }, [])

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    try {
      await fetchMeta()
      const endpoint = clientFilter
        ? `${API}/api/uploads/${clientFilter}`
        : `${API}/api/uploads`
      const res = await fetch(endpoint)
      const data = await res.json()

      // Normalize shape — single-client returns { files }, all-clients returns { files } with clientId
      const rawFiles: any[] = data.files || []
      const mapped: MediaFile[] = rawFiles.map((f: any) => {
        const key = `${f.clientId || clientFilter || 'general'}/${f.filename}`
        const meta = metaRef.current[key]
        return {
          filename: f.filename,
          originalName: meta?.originalName || f.originalName || f.filename,
          size: f.size,
          url: f.url,
          uploadedAt: f.uploadedAt,
          clientId: f.clientId || clientFilter || 'general',
          mimeType: f.mimeType,
          tags: meta?.tags || [],
          description: meta?.description || '',
        }
      })
      setFiles(mapped)
    } catch (err) {
      console.error('Failed to fetch media:', err)
    } finally {
      setLoading(false)
    }
  }, [clientFilter, fetchMeta])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  const upload = useCallback(async (clientId: string, fileList: FileList | File[]) => {
    setUploading(true)
    setUploadProgress(0)
    try {
      const formData = new FormData()
      const filesArray = Array.from(fileList)
      filesArray.forEach(f => formData.append('files', f))

      const xhr = new XMLHttpRequest()
      const result = await new Promise<any>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100))
          }
        })
        xhr.addEventListener('load', () => {
          console.log(`[MediaLibrary] Upload response status: ${xhr.status}`)
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            console.error('[MediaLibrary] Upload error response:', xhr.responseText)
            let errMsg = `Upload failed: ${xhr.status}`
            try {
              const parsed = JSON.parse(xhr.responseText)
              if (parsed.error) errMsg = parsed.error
            } catch {}
            reject(new Error(errMsg))
          }
        })
        xhr.addEventListener('error', () => {
          console.error('[MediaLibrary] XHR Network Error')
          reject(new Error('Upload failed: Network error or connection refused'))
        })
        xhr.open('POST', `${API}/api/uploads/${clientId}`)

        // Add Authorization header
        const token = localStorage.getItem('postboard_token')
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        }

        xhr.send(formData)
      })

      // Save original names to meta
      if (result.files) {
        for (const f of result.files) {
          const key = `${clientId}/${f.filename}`
          await fetch(`${API}/api/media/meta`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key,
              meta: {
                originalName: f.originalName,
                tags: [],
                description: '',
              },
            }),
          })
        }
      }

      await fetchFiles()
      return result
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [fetchFiles])

  const deleteFile = useCallback(async (clientId: string, filename: string) => {
    await fetch(`${API}/api/uploads/${clientId}/${filename}`, { method: 'DELETE' })
    // Also delete meta
    await fetch(`${API}/api/media/meta`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: `${clientId}/${filename}` }),
    })
    setFiles(prev => prev.filter(f => !(f.clientId === clientId && f.filename === filename)))
  }, [])

  const bulkDelete = useCallback(async (items: { clientId: string; filename: string }[]) => {
    await Promise.all(items.map(i => deleteFile(i.clientId, i.filename)))
  }, [deleteFile])

  const updateMeta = useCallback(async (clientId: string, filename: string, meta: { tags?: string[]; description?: string }) => {
    const key = `${clientId}/${filename}`
    const existing = metaRef.current[key] || { tags: [], description: '', originalName: filename }
    const updated = { ...existing, ...meta }
    await fetch(`${API}/api/media/meta`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, meta: updated }),
    })
    metaRef.current[key] = updated
    setFiles(prev => prev.map(f => {
      if (f.clientId === clientId && f.filename === filename) {
        return { ...f, ...meta }
      }
      return f
    }))
  }, [])

  const allTags = Array.from(new Set(files.flatMap(f => f.tags))).sort()

  return {
    files,
    loading,
    uploading,
    uploadProgress,
    allTags,
    upload,
    deleteFile,
    bulkDelete,
    updateMeta,
    refresh: fetchFiles,
  }
}
