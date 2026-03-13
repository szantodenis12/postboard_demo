import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Undo2, Redo2, Download, LayoutGrid, ChevronDown,
} from 'lucide-react'
import { useApp } from '../../../core/context'
import { useCanvas } from '../hooks/useCanvas'
import { Canvas } from './Canvas'
import { Toolbar } from './Toolbar'
import { PropertiesPanel } from './PropertiesPanel'
import { ScriptPanel } from './ScriptPanel'
import { TemplateGallery } from './TemplateGallery'
import { ExportModal } from './ExportModal'
import { CANVAS_FORMATS, FONT_OPTIONS } from '../types'

// Load Google Fonts once
let fontsLoaded = false
function loadFonts() {
  if (fontsLoaded) return
  fontsLoaded = true
  const families = FONT_OPTIONS.filter(f => f !== 'Inter')
    .map(f => f.replace(/ /g, '+') + ':wght@300;400;600;700;900')
    .join('&family=')
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`
  document.head.appendChild(link)
}

export function PostBuilder() {
  const { data, selectedClient } = useApp()
  const cv = useCanvas()
  const [showTemplates, setShowTemplates] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showFormatMenu, setShowFormatMenu] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load Google Fonts
  useEffect(() => { loadFonts() }, [])

  // Client brand colors
  const client = selectedClient ? data.clients.find(c => c.id === selectedClient) : null
  const brandColors = client ? [client.color] : []

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return

      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        cv.undo()
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        cv.redo()
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault()
        cv.redo()
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault()
        if (cv.selectedId) cv.duplicateElement(cv.selectedId)
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (cv.selectedId) {
          e.preventDefault()
          cv.deleteElement(cv.selectedId)
        }
      } else if (e.key === 'Escape') {
        cv.setSelectedId(null)
      } else if (e.key === 'v' || e.key === 'V') {
        cv.setTool('select')
      } else if (e.key === 't' || e.key === 'T') {
        cv.setTool('text')
      } else if (e.key === 'r' || e.key === 'R') {
        cv.setTool('shape-rect')
      } else if (e.key === 'c' && !e.metaKey && !e.ctrlKey) {
        cv.setTool('shape-circle')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [cv])

  // Image upload handler
  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const img = new window.Image()
      img.onload = () => {
        // Scale to fit within canvas, max 60% of canvas width
        const maxW = cv.canvas.width * 0.6
        const maxH = cv.canvas.height * 0.6
        const imgScale = Math.min(maxW / img.width, maxH / img.height, 1)
        const width = img.width * imgScale
        const height = img.height * imgScale

        cv.addElement({
          type: 'image',
          src: reader.result as string,
          x: (cv.canvas.width - width) / 2,
          y: (cv.canvas.height - height) / 2,
          width,
          height,
        })
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)

    // Reset input so same file can be re-uploaded
    e.target.value = ''
  }, [cv])

  const currentFormat = CANVAS_FORMATS.find(f => f.id === cv.formatId)

  return (
    <div className="h-full flex flex-col">
      {/* ── Header Bar ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-3">
        {/* Templates button */}
        <button
          onClick={() => setShowTemplates(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg glass text-xs text-white/50 hover:text-white/80 transition-colors"
        >
          <LayoutGrid size={14} />
          Templates
        </button>

        {/* Format selector */}
        <div className="relative">
          <button
            onClick={() => setShowFormatMenu(!showFormatMenu)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg glass text-xs text-white/50 hover:text-white/80 transition-colors font-mono"
          >
            {currentFormat?.label || 'Custom'}
            <span className="text-white/20">{cv.canvas.width}×{cv.canvas.height}</span>
            <ChevronDown size={12} className="text-white/25" />
          </button>

          {showFormatMenu && (
            <>
              <div className="fixed inset-0 z-50" onClick={() => setShowFormatMenu(false)} />
              <div className="absolute top-full left-0 mt-1 z-50 glass rounded-lg border border-white/[0.08] py-1 min-w-[200px]">
                {CANVAS_FORMATS.map(fmt => (
                  <button
                    key={fmt.id}
                    onClick={() => { cv.setFormat(fmt.id); setShowFormatMenu(false) }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors
                      ${fmt.id === cv.formatId
                        ? 'text-accent-violet bg-accent-violet/10'
                        : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                      }`}
                  >
                    <span>{fmt.label}</span>
                    <span className="text-white/20 font-mono text-[10px]">{fmt.width}×{fmt.height}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Client indicator */}
        {client && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg glass">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: client.color }}
            />
            <span className="text-xs text-white/40">{client.displayName}</span>
          </div>
        )}

        <div className="flex-1" />

        {/* Undo / Redo */}
        <button
          onClick={cv.undo}
          disabled={!cv.canUndo}
          className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] disabled:opacity-20 disabled:hover:bg-transparent transition-all"
          title="Undo (Cmd+Z)"
        >
          <Undo2 size={15} />
        </button>
        <button
          onClick={cv.redo}
          disabled={!cv.canRedo}
          className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] disabled:opacity-20 disabled:hover:bg-transparent transition-all"
          title="Redo (Cmd+Shift+Z)"
        >
          <Redo2 size={15} />
        </button>

        {/* Export */}
        <button
          onClick={() => setShowExport(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-accent-violet to-accent-cyan text-white text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          <Download size={14} />
          Export
        </button>
      </div>

      {/* ── Script Panel ──────────────────────────────────────── */}
      <ScriptPanel posts={client?.posts ?? []} />

      {/* ── Main Area ───────────────────────────────────────── */}
      <div className="flex-1 flex gap-0 overflow-hidden min-h-0">
        <Toolbar
          tool={cv.tool}
          onToolChange={cv.setTool}
          onImageUpload={handleImageUpload}
          brandColors={brandColors}
        />

        <Canvas
          canvas={cv.canvas}
          selectedId={cv.selectedId}
          tool={cv.tool}
          stageRef={cv.stageRef}
          setSelectedId={cv.setSelectedId}
          addElement={cv.addElement}
          updateElement={cv.updateElement}
          updateElementSilent={cv.updateElementSilent}
        />

        <PropertiesPanel
          canvas={cv.canvas}
          selectedElement={cv.selectedElement}
          selectedId={cv.selectedId}
          updateElement={cv.updateElement}
          deleteElement={cv.deleteElement}
          duplicateElement={cv.duplicateElement}
          moveElement={cv.moveElement}
          setBackgroundColor={cv.setBackgroundColor}
        />
      </div>

      {/* ── Hidden file input ───────────────────────────────── */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── Modals ──────────────────────────────────────────── */}
      {showTemplates && (
        <TemplateGallery
          onSelect={t => { cv.loadTemplate(t); setShowTemplates(false) }}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {showExport && (
        <ExportModal
          stageRef={cv.stageRef}
          canvasSize={{ width: cv.canvas.width, height: cv.canvas.height }}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )
}
