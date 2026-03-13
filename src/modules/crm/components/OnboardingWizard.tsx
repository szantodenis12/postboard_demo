import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus, Building2, Users, Palette, Sparkles,
  ArrowRight, ArrowLeft, Loader2, Check, Copy, RotateCcw
} from 'lucide-react'
import { useAIStream } from '../../content-intelligence/hooks/useAI'

interface OnboardData {
  companyName: string
  website: string
  industry: string
  targetAudience: string
  tone: string
  competitors: string
  services: string
}

const INITIAL: OnboardData = {
  companyName: '',
  website: '',
  industry: '',
  targetAudience: '',
  tone: '',
  competitors: '',
  services: '',
}

const STEPS = [
  { id: 'basics', label: 'Company Basics', icon: Building2, fields: ['companyName', 'website', 'industry'] as const },
  { id: 'audience', label: 'Target Audience', icon: Users, fields: ['targetAudience'] as const },
  { id: 'brand', label: 'Brand & Services', icon: Palette, fields: ['tone', 'competitors', 'services'] as const },
  { id: 'generate', label: 'Generate', icon: Sparkles, fields: [] as const },
]

const FIELD_CONFIG: Record<string, { label: string; placeholder: string; type: 'input' | 'textarea'; required?: boolean }> = {
  companyName: { label: 'Company Name', placeholder: 'e.g. Digital Solutions SRL', type: 'input', required: true },
  website: { label: 'Website', placeholder: 'https://www.example.ro', type: 'input' },
  industry: { label: 'Industry', placeholder: 'e.g. E-commerce, HoReCa, Real Estate...', type: 'input' },
  targetAudience: { label: 'Target Audience', placeholder: 'Describe the ideal customer: age, interests, location, behavior...', type: 'textarea' },
  tone: { label: 'Brand Tone & Voice', placeholder: 'e.g. Professional but approachable, playful and young, premium and exclusive...', type: 'textarea' },
  competitors: { label: 'Main Competitors', placeholder: 'List 2-3 competitors (name + website if available)', type: 'textarea' },
  services: { label: 'Key Services / Products', placeholder: 'List the main services or products this client offers', type: 'textarea' },
}

export function OnboardingWizard() {
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<OnboardData>(INITIAL)
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)
  const resultRef = useRef('')
  const resultEndRef = useRef<HTMLDivElement>(null)
  const { stream, streaming, abort } = useAIStream()

  useEffect(() => {
    if (streaming) resultEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [result, streaming])

  const currentStep = STEPS[step]
  const isLastStep = step === STEPS.length - 1
  const canProceed = step === 0 ? formData.companyName.trim() !== '' : true

  const handleGenerate = () => {
    resultRef.current = ''
    setResult('')
    const payload: Record<string, string | undefined> = {
      companyName: formData.companyName.trim(),
      website: formData.website.trim() || undefined,
      industry: formData.industry.trim() || undefined,
      targetAudience: formData.targetAudience.trim() || undefined,
      tone: formData.tone.trim() || undefined,
      competitors: formData.competitors.trim() || undefined,
      services: formData.services.trim() || undefined,
    }
    stream(
      '/api/intelligence/onboard',
      payload,
      (chunk) => { resultRef.current += chunk; setResult(resultRef.current) },
    )
  }

  const handleNext = () => {
    if (isLastStep) {
      handleGenerate()
    } else {
      setStep(s => Math.min(s + 1, STEPS.length - 1))
    }
  }

  const handleBack = () => setStep(s => Math.max(s - 1, 0))

  const handleReset = () => {
    abort()
    setStep(0)
    setFormData(INITIAL)
    setResult('')
    resultRef.current = ''
  }

  const copyResult = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const updateField = (key: string, val: string) => {
    setFormData(prev => ({ ...prev, [key]: val }))
  }

  return (
    <div className="h-full flex flex-col">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Client Onboarding</h2>
        <p className="text-sm text-white/30">Step-by-step wizard to set up new clients</p>
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => !streaming && i < step && setStep(i)}
                disabled={streaming || i > step}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  i === step
                    ? 'glass-active text-white'
                    : i < step
                    ? 'glass text-white/60 cursor-pointer hover:text-white/80'
                    : 'bg-white/[0.03] text-white/20 cursor-not-allowed'
                }`}
              >
                {i < step ? (
                  <Check size={12} className="text-emerald-400" />
                ) : (
                  <s.icon size={12} />
                )}
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px ${i < step ? 'bg-emerald-500/30' : 'bg-white/5'}`} />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto scroll-area">
        <AnimatePresence mode="wait">
          {!isLastStep || (!streaming && !result) ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="glass rounded-xl p-6 max-w-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <currentStep.icon size={20} className="text-violet-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{currentStep.label}</h3>
                  <p className="text-xs text-white/30">Step {step + 1} of {STEPS.length}</p>
                </div>
              </div>

              {isLastStep ? (
                <div className="text-center py-8">
                  <Sparkles size={32} className="text-violet-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Ready to generate</h3>
                  <p className="text-sm text-white/40 max-w-sm mx-auto mb-6">
                    AI will create a complete onboarding package: brand voice guide, content pillars, buyer persona, first month calendar, and hashtag strategy.
                  </p>
                  <div className="glass rounded-lg p-4 text-left max-w-sm mx-auto">
                    <div className="text-xs text-white/30 mb-2">Summary:</div>
                    <div className="text-sm text-white/60"><strong className="text-white/80">Company:</strong> {formData.companyName}</div>
                    {formData.industry && <div className="text-sm text-white/60"><strong className="text-white/80">Industry:</strong> {formData.industry}</div>}
                    {formData.targetAudience && <div className="text-sm text-white/60 truncate"><strong className="text-white/80">Audience:</strong> {formData.targetAudience}</div>}
                    {formData.tone && <div className="text-sm text-white/60 truncate"><strong className="text-white/80">Tone:</strong> {formData.tone}</div>}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {currentStep.fields.map(field => {
                    const cfg = FIELD_CONFIG[field]
                    return (
                      <div key={field}>
                        <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 block">
                          {cfg.label} {cfg.required && <span className="text-red-400">*</span>}
                        </label>
                        {cfg.type === 'textarea' ? (
                          <textarea
                            value={formData[field as keyof OnboardData]}
                            onChange={e => updateField(field, e.target.value)}
                            placeholder={cfg.placeholder}
                            rows={4}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 resize-none"
                          />
                        ) : (
                          <input
                            value={formData[field as keyof OnboardData]}
                            onChange={e => updateField(field, e.target.value)}
                            placeholder={cfg.placeholder}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                <button
                  onClick={handleBack}
                  disabled={step === 0}
                  className="px-4 py-2 rounded-lg glass-hover text-white/40 hover:text-white/60 disabled:opacity-20 disabled:cursor-not-allowed text-sm flex items-center gap-2 transition-colors"
                >
                  <ArrowLeft size={14} />
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!canProceed}
                  className="px-5 py-2.5 rounded-lg bg-violet-500 hover:bg-violet-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  {isLastStep ? (
                    <>
                      <Sparkles size={14} />
                      Generate Package
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-6 max-w-3xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    {streaming ? (
                      <Loader2 size={20} className="animate-spin text-violet-400" />
                    ) : (
                      <Check size={20} className="text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {streaming ? 'Generating onboarding package...' : `Onboarding: ${formData.companyName}`}
                    </h3>
                    <p className="text-xs text-white/30">
                      {streaming ? 'AI is creating your package' : 'Package ready'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!streaming && result && (
                    <button
                      onClick={copyResult}
                      className="p-2 rounded-lg glass-hover text-white/30 hover:text-white/60 transition-colors"
                    >
                      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  )}
                  <button
                    onClick={handleReset}
                    className="p-2 rounded-lg glass-hover text-white/30 hover:text-white/60 transition-colors"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>

              <div className="text-sm text-white/60 whitespace-pre-wrap leading-relaxed">{result}</div>
              {streaming && <div className="mt-2 h-0.5 w-8 bg-violet-500/50 animate-pulse rounded-full" />}
              <div ref={resultEndRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
