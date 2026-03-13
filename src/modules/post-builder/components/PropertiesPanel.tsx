import {
  Trash2, Lock, Unlock, ChevronUp, ChevronDown,
  ChevronsUp, ChevronsDown, AlignLeft, AlignCenter, AlignRight,
  Copy,
} from 'lucide-react'
import type { UseCanvasReturn } from '../hooks/useCanvas'
import { FONT_OPTIONS } from '../types'

export function PropertiesPanel({
  canvas,
  selectedElement,
  selectedId,
  updateElement,
  deleteElement,
  duplicateElement,
  moveElement,
  setBackgroundColor,
}: Pick<
  UseCanvasReturn,
  'canvas' | 'selectedElement' | 'selectedId' | 'updateElement' | 'deleteElement' | 'duplicateElement' | 'moveElement' | 'setBackgroundColor'
>) {
  if (!selectedElement) {
    return (
      <div className="w-[240px] shrink-0 glass rounded-xl ml-2 p-4 overflow-y-auto scroll-area">
        <Section title="Canvas">
          <Field label="Background">
            <ColorInput
              value={canvas.backgroundColor}
              onChange={setBackgroundColor}
            />
          </Field>
          <Field label="Size">
            <span className="text-xs text-white/40 font-mono">
              {canvas.width} × {canvas.height}
            </span>
          </Field>
        </Section>

        <div className="mt-8 text-center text-xs text-white/15">
          Select an element to edit
        </div>
      </div>
    )
  }

  const el = selectedElement
  const update = (updates: Record<string, any>) => updateElement(el.id, updates)

  return (
    <div className="w-[240px] shrink-0 glass rounded-xl ml-2 p-4 overflow-y-auto scroll-area space-y-4">
      {/* Element type badge */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-white/25 font-semibold">
          {el.type === 'shape' ? el.shapeType : el.type}
        </span>
        <div className="flex items-center gap-1">
          <IconBtn
            icon={el.locked ? Lock : Unlock}
            active={el.locked}
            onClick={() => update({ locked: !el.locked })}
            title={el.locked ? 'Unlock' : 'Lock'}
          />
          <IconBtn icon={Copy} onClick={() => duplicateElement(el.id)} title="Duplicate" />
          <IconBtn icon={Trash2} onClick={() => deleteElement(el.id)} title="Delete" className="hover:!text-red-400" />
        </div>
      </div>

      {/* Position & Size */}
      <Section title="Transform">
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="X" value={Math.round(el.x)} onChange={v => update({ x: v })} />
          <NumberField label="Y" value={Math.round(el.y)} onChange={v => update({ y: v })} />
          <NumberField label="W" value={Math.round(el.width)} onChange={v => update({ width: v })} min={5} />
          {el.type !== 'text' && (
            <NumberField label="H" value={Math.round(el.height)} onChange={v => update({ height: v })} min={5} />
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <NumberField label="Rot" value={Math.round(el.rotation)} onChange={v => update({ rotation: v })} suffix="°" />
          <NumberField label="Op" value={Math.round(el.opacity * 100)} onChange={v => update({ opacity: v / 100 })} min={0} max={100} suffix="%" />
        </div>
      </Section>

      {/* Text properties */}
      {el.type === 'text' && (
        <Section title="Text">
          <Field label="Font">
            <select
              value={el.fontFamily || 'Inter'}
              onChange={e => update({ fontFamily: e.target.value })}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1.5 text-xs text-white/70 outline-none"
            >
              {FONT_OPTIONS.map(f => (
                <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Size" value={el.fontSize || 24} onChange={v => update({ fontSize: v })} min={8} max={200} />
            <Field label="Weight">
              <select
                value={el.fontWeight || 400}
                onChange={e => update({ fontWeight: Number(e.target.value) })}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1.5 text-xs text-white/70 outline-none"
              >
                <option value={300}>Light</option>
                <option value={400}>Regular</option>
                <option value={600}>Semi</option>
                <option value={700}>Bold</option>
                <option value={900}>Black</option>
              </select>
            </Field>
          </div>

          <Field label="Color">
            <ColorInput value={el.fill || '#000000'} onChange={v => update({ fill: v })} />
          </Field>

          <Field label="Align">
            <div className="flex gap-1">
              {([
                { value: 'left', icon: AlignLeft },
                { value: 'center', icon: AlignCenter },
                { value: 'right', icon: AlignRight },
              ] as const).map(a => (
                <button
                  key={a.value}
                  onClick={() => update({ align: a.value })}
                  className={`flex-1 flex items-center justify-center py-1.5 rounded-md transition-all text-xs
                    ${el.align === a.value
                      ? 'bg-accent-violet/20 text-accent-violet'
                      : 'bg-white/[0.03] text-white/30 hover:text-white/50'
                    }`}
                >
                  <a.icon size={13} />
                </button>
              ))}
            </div>
          </Field>

          <NumberField label="Line H" value={Math.round((el.lineHeight || 1.3) * 10) / 10} onChange={v => update({ lineHeight: v })} min={0.8} max={3} step={0.1} />
        </Section>
      )}

      {/* Shape properties */}
      {el.type === 'shape' && (
        <Section title="Shape">
          <Field label="Fill">
            <ColorInput value={el.fill || '#7c3aed'} onChange={v => update({ fill: v })} />
          </Field>
          <Field label="Stroke">
            <ColorInput value={el.stroke || 'transparent'} onChange={v => update({ stroke: v })} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Stroke W" value={el.strokeWidth || 0} onChange={v => update({ strokeWidth: v })} min={0} max={50} />
            {el.shapeType === 'rect' && (
              <NumberField label="Radius" value={el.cornerRadius || 0} onChange={v => update({ cornerRadius: v })} min={0} />
            )}
          </div>
        </Section>
      )}

      {/* Layer ordering */}
      <Section title="Layer">
        <div className="flex gap-1">
          <LayerBtn icon={ChevronsDown} label="Bottom" onClick={() => moveElement(el.id, 'bottom')} />
          <LayerBtn icon={ChevronDown} label="Down" onClick={() => moveElement(el.id, 'down')} />
          <LayerBtn icon={ChevronUp} label="Up" onClick={() => moveElement(el.id, 'up')} />
          <LayerBtn icon={ChevronsUp} label="Top" onClick={() => moveElement(el.id, 'top')} />
        </div>
      </Section>

      {/* Canvas background */}
      <Section title="Canvas">
        <Field label="Background">
          <ColorInput value={canvas.backgroundColor} onChange={setBackgroundColor} />
        </Field>
      </Section>
    </div>
  )
}

// ── Helper components ──────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-white/20 font-semibold mb-2">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-[10px] text-white/25 mb-1 block">{label}</span>
      {children}
    </div>
  )
}

function NumberField({
  label, value, onChange, min, max, step = 1, suffix,
}: {
  label: string; value: number; onChange: (v: number) => void
  min?: number; max?: number; step?: number; suffix?: string
}) {
  return (
    <div>
      <span className="text-[10px] text-white/25 mb-0.5 block">{label}</span>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1.5 text-xs text-white/70 outline-none focus:border-accent-violet/30 font-mono tabular-nums"
        />
        {suffix && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white/20">{suffix}</span>
        )}
      </div>
    </div>
  )
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value === 'transparent' ? '#000000' : value}
        onChange={e => onChange(e.target.value)}
        className="w-7 h-7 rounded-md border border-white/10 cursor-pointer bg-transparent [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-0"
      />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1.5 text-xs text-white/50 font-mono outline-none focus:border-accent-violet/30"
      />
    </div>
  )
}

function IconBtn({
  icon: Icon, onClick, title, active, className = '',
}: {
  icon: typeof Trash2; onClick: () => void; title: string; active?: boolean; className?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md transition-all ${
        active ? 'text-accent-violet bg-accent-violet/10' : 'text-white/25 hover:text-white/50 hover:bg-white/[0.04]'
      } ${className}`}
    >
      <Icon size={13} />
    </button>
  )
}

function LayerBtn({ icon: Icon, label, onClick }: { icon: typeof ChevronUp; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="flex-1 flex items-center justify-center py-1.5 rounded-md bg-white/[0.03] text-white/25 hover:text-white/50 hover:bg-white/[0.06] transition-all"
    >
      <Icon size={13} />
    </button>
  )
}
