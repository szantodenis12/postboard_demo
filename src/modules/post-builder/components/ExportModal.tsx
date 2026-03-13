import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Smartphone, Monitor, Image } from 'lucide-react'

export function ExportModal({
  stageRef,
  canvasSize,
  onClose,
}: {
  stageRef: React.RefObject<any>
  canvasSize: { width: number; height: number }
  onClose: () => void
}) {
  const [format, setFormat] = useState<'png' | 'jpg'>('png')
  const [preview, setPreview] = useState<string | null>(null)
  const [mockupMode, setMockupMode] = useState<'none' | 'phone'>('none')
  const linkRef = useRef<HTMLAnchorElement>(null)

  // Generate preview
  useEffect(() => {
    if (!stageRef.current) return
    const stage = stageRef.current
    const scale = stage.scaleX()
    const dataUrl = stage.toDataURL({
      mimeType: format === 'jpg' ? 'image/jpeg' : 'image/png',
      quality: 1,
      pixelRatio: 1 / scale,
    })
    setPreview(dataUrl)
  }, [stageRef, format])

  const handleDownload = () => {
    if (!preview || !linkRef.current) return
    linkRef.current.href = preview
    linkRef.current.download = `design-${canvasSize.width}x${canvasSize.height}.${format}`
    linkRef.current.click()
  }

  const aspect = canvasSize.height / canvasSize.width
  const isStory = aspect > 1.5

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
          className="relative w-full max-w-2xl max-h-[85vh] glass rounded-2xl overflow-hidden flex flex-col"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Download size={16} className="text-accent-cyan" />
              <span className="text-sm font-semibold text-white">Export</span>
              <span className="text-xs text-white/25">{canvasSize.width} × {canvasSize.height}</span>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors">
              <X size={18} className="text-white/40" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {/* Preview */}
            <div className="flex items-center justify-center mb-5">
              {mockupMode === 'phone' ? (
                <div className="relative w-[200px]">
                  {/* Phone frame */}
                  <div className="relative rounded-[28px] border-[6px] border-white/10 bg-black overflow-hidden"
                    style={{ aspectRatio: '9/19.5' }}
                  >
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80px] h-[20px] bg-black rounded-b-xl z-10" />
                    {preview && (
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className="rounded-lg overflow-hidden border border-white/[0.06]"
                  style={{
                    width: isStory ? 180 : 320,
                    height: isStory ? 180 * aspect : 320 * aspect,
                    maxHeight: 400,
                  }}
                >
                  {preview && (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Options */}
            <div className="space-y-4">
              {/* Format */}
              <div>
                <span className="text-[10px] uppercase tracking-widest text-white/20 font-semibold mb-2 block">
                  Format
                </span>
                <div className="flex gap-2">
                  {(['png', 'jpg'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all
                        ${format === f
                          ? 'bg-accent-violet/15 text-accent-violet border border-accent-violet/25'
                          : 'bg-white/[0.03] text-white/30 border border-white/[0.06] hover:text-white/50'
                        }`}
                    >
                      <Image size={13} />
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mockup toggle */}
              <div>
                <span className="text-[10px] uppercase tracking-widest text-white/20 font-semibold mb-2 block">
                  Preview Mode
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMockupMode('none')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all
                      ${mockupMode === 'none'
                        ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/25'
                        : 'bg-white/[0.03] text-white/30 border border-white/[0.06] hover:text-white/50'
                      }`}
                  >
                    <Monitor size={13} />
                    Flat
                  </button>
                  <button
                    onClick={() => setMockupMode('phone')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all
                      ${mockupMode === 'phone'
                        ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/25'
                        : 'bg-white/[0.03] text-white/30 border border-white/[0.06] hover:text-white/50'
                      }`}
                  >
                    <Smartphone size={13} />
                    Phone
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 pt-4 border-t border-white/[0.06]">
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-accent-violet to-accent-cyan text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Download size={16} />
              Download {format.toUpperCase()}
            </button>
            <a ref={linkRef} className="hidden" />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
