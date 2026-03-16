import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  icon?: React.ReactNode
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  disabled = false,
  required = false,
  icon
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const portalRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  const updateCoords = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setCoords({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      })
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      updateCoords()
      window.addEventListener('scroll', updateCoords, true)
      window.addEventListener('resize', updateCoords)
    }
    return () => {
      window.removeEventListener('scroll', updateCoords, true)
      window.removeEventListener('resize', updateCoords)
    }
  }, [isOpen, updateCoords])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isOutsideContainer = containerRef.current && !containerRef.current.contains(event.target as Node)
      const isOutsidePortal = portalRef.current && !portalRef.current.contains(event.target as Node)

      if (isOutsideContainer && isOutsidePortal) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div 
      ref={containerRef}
      className={`relative ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[#0a0a0f]/60 border border-white/[0.08] rounded-2xl px-5 py-3.5 text-sm text-white outline-none focus:border-accent-cyan/30 transition-all hover:bg-[#0a0a0f]/80"
      >
        <div className="flex items-center gap-2 truncate">
          {icon}
          <span className={selectedOption ? 'text-white' : 'text-white/20'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-white/30"
        >
          <ChevronDown size={16} />
        </motion.div>
      </button>

      {isOpen && createPortal(
        <motion.div
          ref={portalRef}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            top: coords.top + 8,
            left: coords.left,
            width: coords.width,
            zIndex: 9999
          }}
          className="bg-[#0a0a0f]/95 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-white/[0.1] max-h-60 overflow-y-auto no-scrollbar"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value)
                setIsOpen(false)
              }}
              className={`w-full px-5 py-3 text-left text-sm transition-colors hover:bg-white/5 flex items-center gap-2 ${
                value === opt.value ? 'text-accent-cyan bg-accent-cyan/5' : 'text-white/70'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </motion.div>,
        document.body
      )}

      {/* Hidden input for form submissions if required */}
      {required && (
        <input 
          type="hidden" 
          value={value} 
          required 
          onChange={() => {}} // No-op to avoid React warning
        />
      )}
    </div>
  )
}
