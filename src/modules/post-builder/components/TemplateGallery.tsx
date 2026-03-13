import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles } from 'lucide-react'
import { templates } from '../templates'
import { CANVAS_FORMATS } from '../types'
import type { Template } from '../types'

export function TemplateGallery({
  onSelect,
  onClose,
}: {
  onSelect: (template: Template) => void
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-6"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-3xl max-h-[80vh] glass rounded-2xl overflow-hidden flex flex-col"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-accent-violet" />
              <span className="text-sm font-semibold text-white">Templates</span>
              <span className="text-xs text-white/25">{templates.length} templates</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <X size={18} className="text-white/40" />
            </button>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-5">
            <div className="grid grid-cols-3 gap-4">
              {/* Blank canvas option */}
              <TemplateCard
                key="blank"
                name="Blank Canvas"
                format="ig-post"
                colors={['#ffffff', '#f5f5f5']}
                isBlank
                onClick={() => {
                  onSelect({
                    id: 'blank',
                    name: 'Blank',
                    format: 'ig-post',
                    previewColors: ['#ffffff'],
                    canvas: { width: 1080, height: 1080, backgroundColor: '#ffffff', elements: [] },
                  })
                }}
              />

              {templates.map(t => (
                <TemplateCard
                  key={t.id}
                  name={t.name}
                  format={t.format}
                  colors={t.previewColors}
                  onClick={() => onSelect(t)}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function TemplateCard({
  name,
  format,
  colors,
  isBlank,
  onClick,
}: {
  name: string
  format: string
  colors: string[]
  isBlank?: boolean
  onClick: () => void
}) {
  const fmt = CANVAS_FORMATS.find(f => f.id === format)
  const aspect = fmt ? fmt.height / fmt.width : 1

  return (
    <button
      onClick={onClick}
      className="group text-left rounded-xl overflow-hidden border border-white/[0.06] hover:border-accent-violet/30 transition-all hover:scale-[1.02]"
    >
      {/* Preview */}
      <div
        className="relative w-full flex items-center justify-center"
        style={{
          paddingTop: `${Math.min(aspect * 100, 130)}%`,
          background: isBlank
            ? 'repeating-conic-gradient(rgba(255,255,255,0.04) 0% 25%, transparent 0% 50%) 0 0 / 16px 16px'
            : colors.length > 1
              ? `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`
              : colors[0],
        }}
      >
        {isBlank && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center">
              <span className="text-white/15 text-lg">+</span>
            </div>
          </div>
        )}
      </div>

      {/* Label */}
      <div className="p-3 bg-white/[0.02]">
        <div className="text-xs font-medium text-white/60 group-hover:text-white/80 transition-colors">
          {name}
        </div>
        <div className="text-[10px] text-white/20 mt-0.5">
          {fmt?.label || format} · {fmt ? `${fmt.width}×${fmt.height}` : ''}
        </div>
      </div>
    </button>
  )
}
