import {
  MousePointer2, Type, Square, Circle, ImagePlus, Upload,
} from 'lucide-react'
import type { ToolType } from '../types'

const tools: { id: ToolType; icon: typeof Type; label: string; shortcut?: string }[] = [
  { id: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
  { id: 'text', icon: Type, label: 'Text', shortcut: 'T' },
  { id: 'shape-rect', icon: Square, label: 'Rectangle', shortcut: 'R' },
  { id: 'shape-circle', icon: Circle, label: 'Circle', shortcut: 'C' },
  { id: 'image', icon: ImagePlus, label: 'Image', shortcut: 'I' },
]

export function Toolbar({
  tool,
  onToolChange,
  onImageUpload,
  brandColors,
}: {
  tool: ToolType
  onToolChange: (t: ToolType) => void
  onImageUpload: () => void
  brandColors: string[]
}) {
  return (
    <div className="w-[52px] shrink-0 flex flex-col items-center py-3 gap-1 glass rounded-xl mr-2">
      {tools.map(t => {
        const Icon = t.icon
        const active = tool === t.id
        return (
          <button
            key={t.id}
            onClick={() => {
              if (t.id === 'image') {
                onImageUpload()
              } else {
                onToolChange(t.id)
              }
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all
              ${active
                ? 'bg-accent-violet/20 text-accent-violet'
                : 'text-white/30 hover:text-white/60 hover:bg-white/[0.04]'
              }`}
            title={`${t.label}${t.shortcut ? ` (${t.shortcut})` : ''}`}
          >
            <Icon size={17} strokeWidth={active ? 2.2 : 1.5} />
          </button>
        )
      })}

      {/* Divider */}
      <div className="w-6 h-px bg-white/[0.06] my-2" />

      {/* Brand colors */}
      {brandColors.length > 0 && (
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[8px] uppercase tracking-widest text-white/15 font-semibold">Brand</span>
          {brandColors.map((color, i) => (
            <button
              key={i}
              className="w-6 h-6 rounded-md border border-white/10 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              title={`Brand color: ${color}`}
              onClick={() => {
                // Copy to clipboard for quick use
                navigator.clipboard.writeText(color)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
