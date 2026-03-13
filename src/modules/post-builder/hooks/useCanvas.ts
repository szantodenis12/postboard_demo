import { useState, useRef, useCallback } from 'react'
import type { CanvasState, CanvasElement, ToolType, Template } from '../types'
import { DEFAULT_CANVAS, CANVAS_FORMATS } from '../types'

const MAX_HISTORY = 50

export function useCanvas() {
  const [canvas, setCanvas] = useState<CanvasState>(DEFAULT_CANVAS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tool, setTool] = useState<ToolType>('select')
  const [formatId, setFormatId] = useState('ig-post')
  const stageRef = useRef<any>(null)

  // History (undo/redo)
  const historyRef = useRef<CanvasState[]>([DEFAULT_CANVAS])
  const historyIndexRef = useRef(0)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const updateUndoRedo = useCallback(() => {
    setCanUndo(historyIndexRef.current > 0)
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1)
  }, [])

  const pushState = useCallback((state: CanvasState) => {
    // Truncate future states
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
    historyRef.current.push(state)
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift()
    historyIndexRef.current = historyRef.current.length - 1
    setCanvas(state)
    updateUndoRedo()
  }, [updateUndoRedo])

  // ── Elements ─────────────────────────────────────────────
  const addElement = useCallback((partial: Partial<CanvasElement>) => {
    const el: CanvasElement = {
      id: crypto.randomUUID(),
      type: 'text',
      x: 100,
      y: 100,
      width: 300,
      height: 60,
      rotation: 0,
      opacity: 1,
      locked: false,
      ...partial,
    }
    const newState = { ...canvas, elements: [...canvas.elements, el] }
    pushState(newState)
    setSelectedId(el.id)
    setTool('select')
    return el.id
  }, [canvas, pushState])

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    const newState = {
      ...canvas,
      elements: canvas.elements.map(el => el.id === id ? { ...el, ...updates } : el),
    }
    pushState(newState)
  }, [canvas, pushState])

  // Silent update — no history push (used during drag/transform)
  const updateElementSilent = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setCanvas(prev => ({
      ...prev,
      elements: prev.elements.map(el => el.id === id ? { ...el, ...updates } : el),
    }))
  }, [])

  const deleteElement = useCallback((id: string) => {
    const newState = {
      ...canvas,
      elements: canvas.elements.filter(el => el.id !== id),
    }
    pushState(newState)
    if (selectedId === id) setSelectedId(null)
  }, [canvas, pushState, selectedId])

  const duplicateElement = useCallback((id: string) => {
    const el = canvas.elements.find(e => e.id === id)
    if (!el) return
    addElement({ ...el, id: undefined as any, x: el.x + 30, y: el.y + 30 })
  }, [canvas.elements, addElement])

  // ── Layer ordering ───────────────────────────────────────
  const moveElement = useCallback((id: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    const idx = canvas.elements.findIndex(e => e.id === id)
    if (idx === -1) return

    const arr = [...canvas.elements]
    const [el] = arr.splice(idx, 1)

    switch (direction) {
      case 'up':
        arr.splice(Math.min(idx + 1, arr.length), 0, el)
        break
      case 'down':
        arr.splice(Math.max(idx - 1, 0), 0, el)
        break
      case 'top':
        arr.push(el)
        break
      case 'bottom':
        arr.unshift(el)
        break
    }

    pushState({ ...canvas, elements: arr })
  }, [canvas, pushState])

  // ── Canvas properties ────────────────────────────────────
  const setBackgroundColor = useCallback((color: string) => {
    pushState({ ...canvas, backgroundColor: color })
  }, [canvas, pushState])

  const setFormat = useCallback((fmtId: string) => {
    const fmt = CANVAS_FORMATS.find(f => f.id === fmtId)
    if (!fmt) return
    setFormatId(fmtId)
    pushState({ ...canvas, width: fmt.width, height: fmt.height })
  }, [canvas, pushState])

  // ── Templates ────────────────────────────────────────────
  const loadTemplate = useCallback((template: Template) => {
    const fmt = CANVAS_FORMATS.find(f => f.id === template.format)
    if (fmt) setFormatId(template.format)
    const newState: CanvasState = {
      width: fmt?.width ?? template.canvas.width,
      height: fmt?.height ?? template.canvas.height,
      backgroundColor: template.canvas.backgroundColor,
      elements: template.canvas.elements.map(el => ({ ...el, id: crypto.randomUUID() })),
    }
    // Reset history with new state
    historyRef.current = [newState]
    historyIndexRef.current = 0
    setCanvas(newState)
    setSelectedId(null)
    updateUndoRedo()
  }, [updateUndoRedo])

  // ── Undo / Redo ──────────────────────────────────────────
  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return
    historyIndexRef.current -= 1
    setCanvas(historyRef.current[historyIndexRef.current])
    setSelectedId(null)
    updateUndoRedo()
  }, [updateUndoRedo])

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return
    historyIndexRef.current += 1
    setCanvas(historyRef.current[historyIndexRef.current])
    setSelectedId(null)
    updateUndoRedo()
  }, [updateUndoRedo])

  // ── Export ───────────────────────────────────────────────
  const exportImage = useCallback((format: 'png' | 'jpg', quality = 1) => {
    if (!stageRef.current) return null
    const stage = stageRef.current
    const scale = stage.scaleX()
    const dataUrl = stage.toDataURL({
      mimeType: format === 'jpg' ? 'image/jpeg' : 'image/png',
      quality,
      pixelRatio: 1 / scale,
    })
    return dataUrl
  }, [])

  // ── Selected element shortcut ────────────────────────────
  const selectedElement = canvas.elements.find(e => e.id === selectedId) ?? null

  return {
    canvas,
    selectedId,
    selectedElement,
    tool,
    formatId,
    stageRef,
    canUndo,
    canRedo,
    setTool,
    setSelectedId,
    setFormat,
    setBackgroundColor,
    addElement,
    updateElement,
    updateElementSilent,
    deleteElement,
    duplicateElement,
    moveElement,
    loadTemplate,
    undo,
    redo,
    exportImage,
  }
}

export type UseCanvasReturn = ReturnType<typeof useCanvas>
