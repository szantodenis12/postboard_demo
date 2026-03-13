import { useState, useCallback, useRef } from 'react'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export function useAIStream() {
  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const stream = useCallback(async (
    url: string,
    body: any,
    onChunk: (text: string) => void,
    onDone?: () => void,
    onError?: (error: string) => void,
    onEvent?: (payload: any) => void,
  ) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setStreaming(true)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        onError?.(err.error || 'AI request failed')
        setStreaming(false)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              onDone?.()
              setStreaming(false)
              return
            }
            try {
              const parsed = JSON.parse(data)
              onEvent?.(parsed)
              if (parsed.text) onChunk(parsed.text)
              if (parsed.error) onError?.(parsed.error)
            } catch { /* skip parse errors */ }
          }
        }
      }
      onDone?.()
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        onError?.(err instanceof Error ? err.message : 'Request failed')
      }
    } finally {
      setStreaming(false)
    }
  }, [])

  const abort = useCallback(() => {
    abortRef.current?.abort()
    setStreaming(false)
  }, [])

  return { stream, streaming, abort }
}

export function useAIStatus() {
  const [configured, setConfigured] = useState<boolean | null>(null)

  const check = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/status')
      const data = await res.json()
      setConfigured(data.configured)
    } catch {
      setConfigured(false)
    }
  }, [])

  return { configured, check }
}
