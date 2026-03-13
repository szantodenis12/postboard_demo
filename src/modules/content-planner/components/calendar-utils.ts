// ── Romanian Calendar Utilities ──────────────────────────
// Public holidays, marketing events, Orthodox Easter, pillar colors, week helpers

export interface CalendarEvent {
  name: string
  type: 'public' | 'marketing'
}

// ── Fixed Romanian Public Holidays (MM-DD) ──────────────
const PUBLIC_HOLIDAYS: [string, string][] = [
  ['01-01', 'Anul Nou'],
  ['01-02', 'Anul Nou'],
  ['01-06', 'Boboteaza'],
  ['01-07', 'Sf. Ioan'],
  ['01-24', 'Ziua Unirii'],
  ['05-01', 'Ziua Muncii'],
  ['06-01', 'Ziua Copilului'],
  ['08-15', 'Sf. Maria'],
  ['11-30', 'Sf. Andrei'],
  ['12-01', 'Ziua Națională'],
  ['12-25', 'Crăciunul'],
  ['12-26', 'Crăciunul'],
]

// ── Marketing Events Worth Planning Content For ─────────
const MARKETING_EVENTS: [string, string][] = [
  ['02-14', "Valentine's Day"],
  ['02-24', 'Dragobete'],
  ['03-01', 'Mărțișor'],
  ['03-08', 'Ziua Femeii'],
  ['04-01', "April Fool's"],
  ['10-31', 'Halloween'],
]

// ── Orthodox Easter (Julian → Gregorian) ────────────────
function orthodoxEaster(year: number): Date {
  const a = year % 4
  const b = year % 7
  const c = year % 19
  const d = (19 * c + 15) % 30
  const e = (2 * a + 4 * b - d + 34) % 7
  const month = Math.floor((d + e + 114) / 31)
  const day = ((d + e + 114) % 31) + 1
  // Julian → Gregorian: +13 days (valid 1900–2099)
  const julian = new Date(year, month - 1, day)
  julian.setDate(julian.getDate() + 13)
  return julian
}

function fmtDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

// ── Build events map for a given year ───────────────────
export function getEventsForYear(year: number): Record<string, CalendarEvent[]> {
  const events: Record<string, CalendarEvent[]> = {}

  const add = (dateStr: string, name: string, type: CalendarEvent['type']) => {
    if (!events[dateStr]) events[dateStr] = []
    if (!events[dateStr].some(e => e.name === name)) {
      events[dateStr].push({ name, type })
    }
  }

  for (const [mmdd, name] of PUBLIC_HOLIDAYS) {
    add(`${year}-${mmdd}`, name, 'public')
  }
  for (const [mmdd, name] of MARKETING_EVENTS) {
    add(`${year}-${mmdd}`, name, 'marketing')
  }

  // Orthodox Easter + movable feasts
  const easter = orthodoxEaster(year)
  add(fmtDate(addDays(easter, -2)), 'Vinerea Mare', 'public')
  add(fmtDate(easter), 'Paștele', 'public')
  add(fmtDate(addDays(easter, 1)), 'Paștele', 'public')
  add(fmtDate(addDays(easter, 49)), 'Rusaliile', 'public')
  add(fmtDate(addDays(easter, 50)), 'Rusaliile', 'public')

  // Black Friday (last Friday of November)
  const bf = new Date(year, 10, 30)
  while (bf.getDay() !== 5) bf.setDate(bf.getDate() - 1)
  add(fmtDate(bf), 'Black Friday', 'marketing')

  // Mother's Day (first Sunday of May in Romania)
  const md = new Date(year, 4, 1)
  while (md.getDay() !== 0) md.setDate(md.getDate() + 1)
  add(fmtDate(md), 'Ziua Mamei', 'marketing')

  return events
}

// ── Pillar Colors ───────────────────────────────────────
const PILLAR_PALETTE = [
  '#7c3aed', '#06b6d4', '#f97316', '#ec4899', '#10b981',
  '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6',
]

export function getPillarColor(pillar: string): string {
  let hash = 0
  for (let i = 0; i < pillar.length; i++) {
    hash = ((hash << 5) - hash + pillar.charCodeAt(i)) | 0
  }
  return PILLAR_PALETTE[Math.abs(hash) % PILLAR_PALETTE.length]
}

// ── Week Helpers ────────────────────────────────────────
export function getMondayOf(d: Date): Date {
  const result = new Date(d)
  const day = result.getDay()
  const diff = day === 0 ? -6 : 1 - day
  result.setDate(result.getDate() + diff)
  result.setHours(0, 0, 0, 0)
  return result
}

export function getWeekDates(monday: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => fmtDate(addDays(monday, i)))
}
