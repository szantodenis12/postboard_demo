import { useState, useEffect, useCallback } from 'react'
import type { PostMediaItem } from '../types'

export function usePostImages() {
  const [media, setMedia] = useState<Record<string, PostMediaItem[]>>({})

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/post-media')
      if (res.ok) setMedia(await res.json())
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const getImageUrl = useCallback((postId: string) => {
    const image = (media[postId] || []).find(item => item.type === 'image')
    return image?.url || null
  }, [media])

  const getPostMedia = useCallback((postId: string) => media[postId] || [], [media])
  const hasPostMedia = useCallback((postId: string) => (media[postId] || []).length > 0, [media])

  return {
    postMedia: media,
    getImageUrl,
    getPostMedia,
    hasPostMedia,
    refreshImages: refresh,
  }
}
