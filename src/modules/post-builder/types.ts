import type { Platform } from '../../core/types'

// ── Canvas Element ─────────────────────────────────────────
export interface CanvasElement {
  id: string
  type: 'text' | 'image' | 'shape'
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  locked: boolean
  // Text
  text?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: number
  fill?: string
  align?: 'left' | 'center' | 'right'
  lineHeight?: number
  // Image
  src?: string
  // Shape
  shapeType?: 'rect' | 'circle'
  stroke?: string
  strokeWidth?: number
  cornerRadius?: number
}

// ── Canvas State ───────────────────────────────────────────
export interface CanvasState {
  width: number
  height: number
  backgroundColor: string
  elements: CanvasElement[]
}

// ── Canvas Format (size presets) ───────────────────────────
export interface CanvasFormat {
  id: string
  label: string
  width: number
  height: number
  platform: Platform | 'general'
}

// ── Template ───────────────────────────────────────────────
export interface Template {
  id: string
  name: string
  format: string
  previewColors: string[]
  canvas: CanvasState
}

// ── Tool ───────────────────────────────────────────────────
export type ToolType = 'select' | 'text' | 'shape-rect' | 'shape-circle' | 'image'

// ── Constants ──────────────────────────────────────────────
export const CANVAS_FORMATS: CanvasFormat[] = [
  { id: 'ig-post',    label: 'IG Post',       width: 1080, height: 1080, platform: 'instagram' },
  { id: 'ig-story',   label: 'IG Story',      width: 1080, height: 1920, platform: 'instagram' },
  { id: 'fb-post',    label: 'FB Post',       width: 1200, height: 630,  platform: 'facebook' },
  { id: 'carousel',   label: 'Carousel',      width: 1080, height: 1080, platform: 'instagram' },
  { id: 'linkedin',   label: 'LinkedIn Post', width: 1200, height: 627,  platform: 'linkedin' },
  { id: 'fb-cover',   label: 'FB Cover',      width: 820,  height: 312,  platform: 'facebook' },
]

export const FONT_OPTIONS = [
  'Inter',
  'Montserrat',
  'Playfair Display',
  'Poppins',
  'Oswald',
  'Raleway',
  'Bebas Neue',
  'Roboto',
  'Open Sans',
  'Lato',
]

export const DEFAULT_CANVAS: CanvasState = {
  width: 1080,
  height: 1080,
  backgroundColor: '#ffffff',
  elements: [],
}
