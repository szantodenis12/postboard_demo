import express from 'express'
import { spawn } from 'child_process'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs'
import { resolve, join } from 'path'
import { getClientContext } from './ai.ts'
import { scanClients } from './scanner.ts'
import type { Response } from 'express'

const router = express.Router()
const DATA_DIR = resolve(import.meta.dirname, '..', 'data')
const PROJECT_ROOT = resolve(import.meta.dirname, '..', '..', '..')

// ── SSE helpers ──────────────────────────────────────────
function initSSE(res: Response) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
}
function sendSSE(res: Response, data: any) {
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}
function endSSE(res: Response) {
  res.write('data: [DONE]\n\n')
  res.end()
}
function runClaude(res: Response, prompt: string, options?: { allowWeb?: boolean }) {
  initSSE(res)
  const env = { ...process.env, NO_COLOR: '1', CLAUDECODE: '' }
  const args = ['-p', '--model', 'sonnet']
  if (options?.allowWeb) args.push('--allowedTools', 'WebSearch,WebFetch', '--permission-mode', 'auto')
  const proc = spawn('claude', args, {
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  proc.stdin.write(prompt)
  proc.stdin.end()
  res.on('close', () => { if (!proc.killed) proc.kill('SIGTERM') })
  proc.stdout.on('data', (chunk: Buffer) => {
    const text = chunk.toString()
    if (text) sendSSE(res, { text })
  })
  proc.stderr.on('data', (chunk: Buffer) => {
    console.error('[intelligence]', chunk.toString().trim())
  })
  proc.on('close', (code) => {
    if (code !== 0 && !res.writableEnded) sendSSE(res, { error: `Claude exited with code ${code}` })
    if (!res.writableEnded) endSSE(res)
  })
  proc.on('error', (err) => {
    if (!res.writableEnded) { sendSSE(res, { error: err.message }); endSSE(res) }
  })
}

function readJSON(file: string): any {
  try { if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf-8')) } catch {}
  return null
}
function writeJSON(file: string, data: any) {
  writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8')
}

const PILLAR_COLORS: Record<string, string> = {
  educational: '#3b82f6', promotional: '#f97316', engagement: '#ec4899',
  'behind-the-scenes': '#8b5cf6', testimonial: '#10b981', inspirational: '#f59e0b',
  informational: '#06b6d4', entertainment: '#ef4444',
}

// ── Client directory resolver ────────────────────────────
// The scanner generates clientId as: dirName.toLowerCase().replace(/[^a-z0-9]/g, '-')
// We need to reverse that to find the actual folder name.
function resolveClientDir(clientId: string): string | null {
  const clientiDir = join(PROJECT_ROOT, 'CLIENTI')
  if (!existsSync(clientiDir)) return null
  try {
    const dirs = readdirSync(clientiDir)
    for (const dir of dirs) {
      const id = dir.toLowerCase().replace(/[^a-z0-9]/g, '-')
      if (id === clientId) return dir
    }
  } catch { /* skip */ }
  return null
}

// ── Post file generation ─────────────────────────────────
interface CalendarPost {
  date: string       // DD.MM.YYYY
  time?: string      // HH:MM
  platform: string   // facebook/instagram/linkedin/tiktok/stories
  format: string     // single-image/carousel/reel/stories/video/text
  pillar: string     // educational/promotional/engagement/behind-the-scenes/testimonial/inspirational
  caption: string
  hashtags: string[] // without # prefix
  visualDescription?: string
  cta?: string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function formatDateForFilename(dateStr: string): string {
  // Input: DD.MM.YYYY — Output: YYYY-MM-DD
  const match = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (match) {
    return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
  }
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  return dateStr.replace(/[^0-9]/g, '-')
}

function resolveUniqueFilePath(dir: string, baseName: string): string {
  const candidate = join(dir, `${baseName}.md`)
  if (!existsSync(candidate)) return candidate
  for (let i = 2; i <= 99; i++) {
    const alt = join(dir, `${baseName}_${i}.md`)
    if (!existsSync(alt)) return alt
  }
  // Fallback with timestamp
  return join(dir, `${baseName}_${Date.now()}.md`)
}

function buildPostMarkdown(post: CalendarPost, clientName: string): string {
  const today = new Date().toISOString().split('T')[0]
  const hashtagLine = post.hashtags.length > 0
    ? post.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')
    : ''

  // Build YAML frontmatter
  const lines: string[] = [
    '---',
    `client: ${clientName}`,
    'type: social-media-content',
    'use-for: [social-media, content-creation]',
    'priority: medium',
    `last-updated: ${today}`,
    `summary: "Postare ${post.platform} — ${post.pillar} — ${post.date}"`,
    '---',
    '',
  ]

  // Build post body in POSTAREA format (scanner Strategy A)
  lines.push(`## POSTAREA 1 — ${post.date}`)
  lines.push('')
  lines.push(`**Platforma:** ${post.platform}`)
  lines.push(`**Tip:** ${post.format}`)
  if (post.pillar) lines.push(`**Pilon:** ${post.pillar}`)
  if (post.time) lines.push(`Ora: ${post.time}`)
  lines.push('')

  if (post.visualDescription) {
    lines.push(`**Vizual:** ${post.visualDescription}`)
    lines.push('')
  }

  // Caption as blockquote (scanner's extractCaption reads this)
  lines.push('**Caption:**')
  const captionLines = post.caption.split('\n')
  for (const cl of captionLines) {
    lines.push(`> ${cl}`)
  }
  if (hashtagLine) {
    lines.push('>')
    lines.push(`> ${hashtagLine}`)
  }
  lines.push('')

  if (post.cta) {
    lines.push(`**CTA:** ${post.cta}`)
    lines.push('')
  }

  lines.push('---')
  lines.push('')

  return lines.join('\n')
}

// ══════════════════════════════════════════════════════════
// 1. AI Calendar Auto-Fill
// ══════════════════════════════════════════════════════════
router.post('/calendar-fill', (req, res) => {
  const { clientId, month, year, postsPerWeek = 3 } = req.body
  if (!clientId) { res.status(400).json({ error: 'Missing clientId' }); return }
  const context = getClientContext(PROJECT_ROOT, clientId, {
    task: 'campaign-planning',
    query: `calendar editorial ${month || ''} ${year || ''} ${postsPerWeek} posts pe săptămână`,
  })
  const monthNames = ['ianuarie','februarie','martie','aprilie','mai','iunie','iulie','august','septembrie','octombrie','noiembrie','decembrie']
  const prompt = `You are a senior social media content strategist for Epic Digital Hub.

CLIENT CONTEXT:
${context}

---

Generate a content calendar for ${monthNames[(month||1)-1]} ${year||2026}. ${postsPerWeek} posts/week.

IMPORTANT: You MUST output each post as a structured JSON block wrapped in \`\`\`json fences. After ALL posts, output a final block with the complete array.

For each post, output:
\`\`\`json
{"date":"DD.MM.YYYY","time":"HH:MM","platform":"facebook|instagram","format":"single-image|carousel|reel|stories","pillar":"educational|promotional|engagement|behind-the-scenes|testimonial|inspirational","caption":"Full caption text in Romanian","hashtags":["tag1","tag2"],"visualDescription":"What the image should show","cta":"Call to action text"}
\`\`\`

Between JSON blocks, add a brief explanation of the post strategy in natural text (1-2 sentences).

After ALL posts, output the complete collection:
\`\`\`json:complete
[...all post objects as an array...]
\`\`\`

Rules:
- Mix content pillars well. Include engagement posts.
- Use proper Romanian diacritics: ă, â, î, ș, ț.
- Hashtags without the # prefix.
- Captions should be full, ready-to-publish text in Romanian (not just ideas).
- Time should be optimal only if supported by the internal context; otherwise choose a neutral working hour and do not claim it is validated by data.
- ${postsPerWeek} posts per week, spread across the month.`
  runClaudeWithParsing(res, prompt)
})

// ── Enhanced Claude runner that parses structured posts ───
function runClaudeWithParsing(res: Response, prompt: string, options?: { allowWeb?: boolean }) {
  initSSE(res)
  const env = { ...process.env, NO_COLOR: '1', CLAUDECODE: '' }
  const args = ['-p', '--model', 'sonnet']
  if (options?.allowWeb) args.push('--allowedTools', 'WebSearch,WebFetch', '--permission-mode', 'auto')
  const proc = spawn('claude', args, {
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  proc.stdin.write(prompt)
  proc.stdin.end()
  res.on('close', () => { if (!proc.killed) proc.kill('SIGTERM') })

  let fullOutput = ''

  proc.stdout.on('data', (chunk: Buffer) => {
    const text = chunk.toString()
    if (text) {
      fullOutput += text
      sendSSE(res, { text })
    }
  })
  proc.stderr.on('data', (chunk: Buffer) => {
    console.error('[intelligence]', chunk.toString().trim())
  })
  proc.on('close', (code) => {
    if (code !== 0 && !res.writableEnded) {
      sendSSE(res, { error: `Claude exited with code ${code}` })
    }

    // Parse structured posts from the full output
    if (!res.writableEnded) {
      const posts = parsePostsFromOutput(fullOutput)
      if (posts.length > 0) {
        sendSSE(res, { type: 'complete', posts })
      }
      endSSE(res)
    }
  })
  proc.on('error', (err) => {
    if (!res.writableEnded) { sendSSE(res, { error: err.message }); endSSE(res) }
  })
}

// ── Parse posts from Claude output ───────────────────────
function parsePostsFromOutput(output: string): CalendarPost[] {
  // Strategy 1: Look for the ```json:complete block with the full array
  const completeMatch = output.match(/```json:complete\s*\n([\s\S]*?)```/)
  if (completeMatch) {
    try {
      const arr = JSON.parse(completeMatch[1].trim())
      if (Array.isArray(arr) && arr.length > 0) return validatePosts(arr)
    } catch { /* fall through to Strategy 2 */ }
  }

  // Strategy 2: Collect individual ```json blocks
  const jsonBlocks = [...output.matchAll(/```json\s*\n([\s\S]*?)```/g)]
  const posts: CalendarPost[] = []
  for (const match of jsonBlocks) {
    try {
      const parsed = JSON.parse(match[1].trim())
      // Could be a single post object or an array
      if (Array.isArray(parsed)) {
        posts.push(...parsed)
      } else if (parsed.date && parsed.platform) {
        posts.push(parsed)
      }
    } catch { /* skip unparseable blocks */ }
  }
  if (posts.length > 0) return validatePosts(posts)

  // Strategy 3: Try to find any JSON array in the output
  const arrayMatches = [...output.matchAll(/\[\s*\{[\s\S]*?\}\s*\]/g)]
  for (const match of arrayMatches) {
    try {
      const arr = JSON.parse(match[0])
      if (Array.isArray(arr) && arr.length > 0 && arr[0].date) return validatePosts(arr)
    } catch { /* skip */ }
  }

  return []
}

function validatePosts(raw: any[]): CalendarPost[] {
  const validPlatforms = new Set(['facebook', 'instagram', 'linkedin', 'tiktok', 'stories', 'google'])
  const validFormats = new Set(['single-image', 'carousel', 'reel', 'stories', 'video', 'text'])
  const validPillars = new Set(['educational', 'promotional', 'engagement', 'behind-the-scenes', 'testimonial', 'inspirational', 'informational', 'entertainment'])

  return raw
    .filter(p => p && typeof p === 'object' && p.date && p.platform && p.caption)
    .map(p => ({
      date: String(p.date),
      time: p.time ? String(p.time) : undefined,
      platform: validPlatforms.has(p.platform?.toLowerCase()) ? p.platform.toLowerCase() : 'facebook',
      format: validFormats.has(p.format?.toLowerCase()) ? p.format.toLowerCase() : 'single-image',
      pillar: validPillars.has(p.pillar?.toLowerCase()) ? p.pillar.toLowerCase() : 'educational',
      caption: String(p.caption),
      hashtags: Array.isArray(p.hashtags)
        ? p.hashtags.map((h: any) => String(h).replace(/^#/, ''))
        : [],
      visualDescription: p.visualDescription ? String(p.visualDescription) : undefined,
      cta: p.cta ? String(p.cta) : undefined,
    }))
}

// ══════════════════════════════════════════════════════════
// 1b. AI Calendar Fill — Apply (write post files to disk)
// ══════════════════════════════════════════════════════════
router.post('/calendar-fill/apply', (req, res) => {
  const { clientId, posts } = req.body
  if (!clientId) { res.status(400).json({ error: 'Missing clientId' }); return }
  if (!Array.isArray(posts) || posts.length === 0) {
    res.status(400).json({ error: 'Missing or empty posts array' }); return
  }

  // Resolve client directory name from clientId
  const clientDir = resolveClientDir(clientId)
  if (!clientDir) {
    res.status(404).json({ error: `Client directory not found for id: ${clientId}` }); return
  }

  const clientName = clientDir.replace(/_/g, ' ')
  const socialMediaDir = join(PROJECT_ROOT, 'CLIENTI', clientDir, 'CONTENT', 'SOCIAL_MEDIA')

  // Ensure directory exists
  mkdirSync(socialMediaDir, { recursive: true })

  const createdFiles: string[] = []
  const errors: string[] = []

  for (const post of posts) {
    try {
      // Validate required fields
      if (!post.date || !post.platform || !post.caption) {
        errors.push(`Skipped post: missing required fields (date/platform/caption)`)
        continue
      }

      const validated = validatePosts([post])
      if (validated.length === 0) {
        errors.push(`Skipped post on ${post.date}: validation failed`)
        continue
      }
      const p = validated[0]

      // Generate filename: YYYY-MM-DD_platform_pillar.md
      const isoDate = formatDateForFilename(p.date)
      const pillarSlug = slugify(p.pillar || 'post')
      const baseName = `${isoDate}_${p.platform}_${pillarSlug}`

      // Determine subdirectory: platform-specific if it exists, otherwise root SOCIAL_MEDIA
      const platformDir = join(socialMediaDir, p.platform.toUpperCase())
      const targetDir = existsSync(platformDir) ? platformDir : socialMediaDir

      const filePath = resolveUniqueFilePath(targetDir, baseName)
      const markdown = buildPostMarkdown(p, clientName)

      writeFileSync(filePath, markdown, 'utf-8')
      createdFiles.push(filePath)
    } catch (err: any) {
      errors.push(`Error writing post: ${err.message}`)
    }
  }

  res.json({
    success: createdFiles.length > 0,
    created: createdFiles.length,
    files: createdFiles,
    ...(errors.length > 0 ? { errors } : {}),
  })
})

// ══════════════════════════════════════════════════════════
// 2. Content Repurposing
// ══════════════════════════════════════════════════════════
router.post('/repurpose', (req, res) => {
  const { clientId, caption, platform, hashtags } = req.body
  if (!clientId || !caption) { res.status(400).json({ error: 'Missing data' }); return }
  const context = getClientContext(PROJECT_ROOT, clientId, {
    task: 'content-creation',
    query: `${platform || ''} ${caption} ${hashtags || ''}`,
  })
  const prompt = `You are a senior social media content strategist.

CLIENT CONTEXT:
${context}

---

Original ${platform || 'social media'} post:
"""
${caption}
${hashtags ? `Hashtags: ${hashtags}` : ''}
"""

Repurpose into optimized versions for:
1. **Facebook** — conversational, include CTA
2. **Instagram Feed** — visual-first, 20-30 hashtags
3. **Instagram Stories** — short hook, poll idea
4. **Instagram Reels** — script: hook/content/CTA
5. **LinkedIn** — professional, thought-leadership
6. **TikTok** — ultra-casual, hook-first

Each in Romanian with proper diacritics. Label each clearly.
Do not invent product claims or offers that are not confirmed in the source post or internal docs.`
  runClaude(res, prompt)
})

// ══════════════════════════════════════════════════════════
// 3. Competitor Analysis (multi-competitor with focus areas)
// ══════════════════════════════════════════════════════════
const FOCUS_LABELS: Record<string, string> = {
  'content-strategy': 'Content Strategy — posting frequency, content types, themes, tone, messaging approach',
  'engagement': 'Engagement Patterns — what content gets most interaction, comment sentiment, share triggers',
  'visual': 'Visual Style — branding consistency, colors, imagery approach, video quality, design patterns',
  'audience': 'Audience Targeting — who they reach, demographics, psychographics, community engagement',
  'ads': 'Ad Activity — visible sponsored content, ad formats, messaging in ads, offers & promotions',
}

router.post('/competitor-analyze', (req, res) => {
  // Support both legacy (single) and new (multi) format
  const { clientId, competitors, focus, competitorName, competitorUrl, notes } = req.body

  // Legacy single-competitor support
  if (competitorName && !competitors) {
    if (!clientId) { res.status(400).json({ error: 'Missing data' }); return }
    const context = getClientContext(PROJECT_ROOT, clientId, {
      task: 'strategy',
      query: `${competitorName} ${competitorUrl || ''} ${notes || ''}`,
    })
    const prompt = `You are a competitive analysis expert for a Romanian marketing agency. Use WebSearch and WebFetch to research the competitor thoroughly — check their website, social media, reviews.

OUR CLIENT:
${context}

---

Analyze competitor: **${competitorName}**
${competitorUrl ? `URL: ${competitorUrl}` : ''}
${notes ? `Notes: ${notes}` : ''}

Research this competitor online, then cover:
1) Content Strategy — their approach, tone, themes, posting frequency
2) Platform Presence — which platforms, follower counts, activity level
3) Content Gaps — opportunities they miss that our client can exploit
4) Recommendations — 5 actionable items for our client (in Romanian)
5) Comparison table — key differentiators (Metric | Our Client | Competitor)

All recommendations in Romanian.`
    runClaude(res, prompt, { allowWeb: true })
    return
  }

  // New multi-competitor format
  if (!clientId || !Array.isArray(competitors) || competitors.length === 0) {
    res.status(400).json({ error: 'Missing clientId or competitors array' }); return
  }
  const context = getClientContext(PROJECT_ROOT, clientId, {
    task: 'strategy',
    query: `${competitors.join(' ')} ${(Array.isArray(focus) ? focus.join(' ') : '')}`,
  })
  const competitorList = competitors.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')
  const focusAreas = Array.isArray(focus) && focus.length > 0
    ? focus.map((f: string) => FOCUS_LABELS[f] || f).join('\n- ')
    : Object.values(FOCUS_LABELS).join('\n- ')

  const prompt = `You are a competitive analysis expert for a Romanian marketing agency (Epic Digital Hub). Use WebSearch and WebFetch to research each competitor thoroughly — check their websites, social media profiles, reviews, and any visible ad activity.

OUR CLIENT:
${context}

---

COMPETITORS TO ANALYZE:
${competitorList}

ANALYSIS FOCUS AREAS:
- ${focusAreas}

INSTRUCTIONS:
Research each competitor online. Structure your analysis as follows:

# Competitor Overview
For each competitor, provide a dedicated section with:
- Brief description (what they do, market position)
- Online presence summary (website quality, social platforms, follower counts if findable)
- Key observations from each focus area listed above

# Comparative Strengths & Weaknesses
A clear comparison between all competitors AND our client:
- What each competitor does well
- Where each competitor falls short
- How our client compares

# Opportunities for Our Client
Specific gaps and opportunities our client can exploit based on competitor weaknesses and market gaps.

# Actionable Recommendations
5-8 specific, actionable content and marketing recommendations for our client. Each should be concrete (not generic) — include content ideas, format suggestions, platform-specific tactics.

# Comparison Table
| Metric | Our Client | ${competitors.map((c: string) => c.split('/').pop()?.replace(/^www\./, '') || c).join(' | ')} |

All recommendations and insights in Romanian with proper diacritics (ă, â, î, ș, ț).`

  runClaude(res, prompt, { allowWeb: true })
})

// ══════════════════════════════════════════════════════════
// 4. Performance Prediction
// ══════════════════════════════════════════════════════════
router.post('/predict-performance', (req, res) => {
  const { clientId, caption, platform, format, hashtags } = req.body
  if (!clientId) { res.json({ error: 'Missing clientId' }); return }

  const store = readJSON(resolve(DATA_DIR, 'analytics.json')) || {}
  const a = store[clientId]
  let baseEng = 25, baseReach = 1500
  let confidence: string = 'low'
  const factors: string[] = []

  if (a?.combined) {
    baseEng = a.combined.avgEngagement || 25
    baseReach = baseEng * 40
    confidence = a.combined.totalPosts > 10 ? 'high' : 'medium'
    factors.push(`Based on ${a.combined.totalPosts} historical posts`)
  } else { factors.push('No historical data — using industry estimates') }

  const len = (caption || '').length
  if (len > 50 && len < 300) { baseEng *= 1.15; factors.push('Optimal caption length') }
  else if (len > 500) { baseEng *= 0.85; factors.push('Long caption may reduce engagement') }

  const hc = Array.isArray(hashtags) ? hashtags.length : 0
  if (hc >= 5 && hc <= 15) { baseEng *= 1.1; factors.push(`${hc} hashtags — good range`) }
  else if (hc === 0) factors.push('No hashtags — add for reach')

  if (format === 'carousel') { baseEng *= 1.25; baseReach *= 1.3; factors.push('Carousels get +25% engagement') }
  else if (format === 'reel') { baseReach *= 2; factors.push('Reels get 2x reach') }

  if (platform === 'instagram') { baseEng *= 1.1; factors.push('Instagram has higher engagement rates') }

  res.json({
    expectedReach: { min: Math.round(baseReach * 0.5), max: Math.round(baseReach * 1.4) },
    expectedEngagement: { min: Math.round(baseEng * 0.6), max: Math.round(baseEng * 1.5) },
    engagementRate: baseReach > 0 ? Math.round((baseEng / baseReach) * 1000) / 10 : 2.5,
    confidence,
    factors: factors.slice(0, 5),
  })
})

// ══════════════════════════════════════════════════════════
// 5. Health Scores
// ══════════════════════════════════════════════════════════
router.get('/health-scores', (req, res) => {
  const { clientId } = req.query
  try {
    const cd = scanClients(PROJECT_ROOT)
    const analytics = readJSON(resolve(DATA_DIR, 'analytics.json')) || {}
    const crm = readJSON(resolve(DATA_DIR, 'crm.json')) || { contracts: [] }
    const clients = clientId ? cd.clients.filter(c => c.id === clientId) : cd.clients

    const scores = clients.map(cl => {
      const fourWeeksAgo = new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0]
      const recent = cl.posts.filter(p => p.date >= fourWeeksAgo)
      const ppw = recent.length / 4

      let posting = ppw >= 4 ? 25 : ppw >= 3 ? 20 : ppw >= 2 ? 15 : ppw >= 1 ? 10 : 0
      let engagement = 15
      const a = analytics[cl.id]
      if (a?.combined?.engagementByDay?.length > 0) {
        const d = a.combined.engagementByDay
        const mid = Math.floor(d.length / 2)
        const h1 = d.slice(0, mid).reduce((s: number, x: any) => s + x.engagement, 0)
        const h2 = d.slice(mid).reduce((s: number, x: any) => s + x.engagement, 0)
        engagement = h2 > h1 * 1.1 ? 25 : h2 > h1 * 0.9 ? 20 : 10
      }
      const total = cl.stats.total || 1
      const ratio = (cl.stats.approved + cl.stats.published + cl.stats.scheduled) / total
      let approval = ratio > 0.8 ? 25 : ratio > 0.6 ? 20 : ratio > 0.4 ? 15 : 10
      const contracts = (crm.contracts || []).filter((c: any) => c.clientId === cl.id)
      let contract = 15
      if (contracts.some((c: any) => c.status === 'active')) contract = 25
      else if (contracts.some((c: any) => c.status === 'expired')) contract = 5

      const score = posting + engagement + approval + contract
      const grade = score >= 80 ? 'excellent' : score >= 65 ? 'good' : score >= 50 ? 'fair' : score >= 35 ? 'at-risk' : 'critical'
      const alerts: string[] = []
      if (posting < 10) alerts.push('No posts in last 4 weeks')
      if (engagement <= 10) alerts.push('Engagement declining')
      if (contract <= 5) alerts.push('Contract expired')
      if (approval <= 10) alerts.push('Low approval rate')

      return { clientId: cl.id, score, grade, factors: { postingConsistency: posting, engagementTrend: engagement, approvalSpeed: approval, contractStatus: contract }, alerts }
    })
    res.json({ scores })
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

// ══════════════════════════════════════════════════════════
// 6. Best Times
// ══════════════════════════════════════════════════════════
router.get('/best-times', (req, res) => {
  const { clientId } = req.query
  if (!clientId) { res.json({ slots: [], recommendation: 'Select a client' }); return }
  const store = readJSON(resolve(DATA_DIR, 'analytics.json')) || {}
  const a = store[clientId as string]
  if (!a?.combined?.engagementByDay?.length) {
    res.json({ slots: [], recommendation: 'No data. Fetch from Meta first.' }); return
  }

  const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
  const hourMap = new Map<string, { eng: number; count: number }>()
  const allPosts = [...(a.facebook?.posts || []), ...(a.instagram?.posts || [])]
  for (const p of allPosts) {
    if (!p.publishedAt) continue
    const d = new Date(p.publishedAt)
    const key = `${dayNames[d.getDay()]}-${d.getHours()}`
    const ex = hourMap.get(key) || { eng: 0, count: 0 }
    ex.eng += p.engagement || 0; ex.count++
    hourMap.set(key, ex)
  }

  const maxEng = Math.max(...Array.from(hourMap.values()).map(v => v.count > 0 ? v.eng / v.count : 0), 1)
  const slots = Array.from(hourMap.entries()).map(([key, data]) => {
    const [day, h] = key.split('-')
    const avg = data.count > 0 ? Math.round(data.eng / data.count) : 0
    return { day, hour: parseInt(h), avgEngagement: avg, postCount: data.count, score: Math.round((avg / maxEng) * 100) }
  }).sort((a, b) => b.score - a.score)

  const dayLabels: Record<string, string> = { monday:'Luni', tuesday:'Marți', wednesday:'Miercuri', thursday:'Joi', friday:'Vineri', saturday:'Sâmbătă', sunday:'Duminică' }
  const top = slots.slice(0, 3)
  const rec = top.length > 0
    ? `Cele mai bune momente: ${top.map(s => `${dayLabels[s.day]||s.day} la ${String(s.hour).padStart(2,'0')}:00`).join(', ')}`
    : 'Insufficient data'

  res.json({ slots: slots.slice(0, 50), recommendation: rec })
})

// ══════════════════════════════════════════════════════════
// 7. Pillar Balance
// ══════════════════════════════════════════════════════════
router.get('/pillar-balance', (req, res) => {
  const { clientId } = req.query
  try {
    const cd = scanClients(PROJECT_ROOT)
    const clients = clientId ? cd.clients.filter(c => c.id === clientId) : cd.clients
    const balances = clients.map(cl => {
      const pm = new Map<string, number>()
      let untagged = 0
      for (const p of cl.posts) {
        const pillar = p.pillar?.toLowerCase().trim()
        if (pillar) pm.set(pillar, (pm.get(pillar) || 0) + 1)
        else untagged++
      }
      const total = cl.posts.length
      const pillars = Array.from(pm.entries())
        .map(([pillar, count]) => ({ pillar, count, percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0, color: PILLAR_COLORS[pillar] || '#64748b' }))
        .sort((a, b) => b.count - a.count)
      return { clientId: cl.id, total, pillars, untagged }
    })
    res.json({ balances })
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

// ══════════════════════════════════════════════════════════
// 8. ROI
// ══════════════════════════════════════════════════════════
router.get('/roi', (req, res) => {
  const { clientId } = req.query
  if (!clientId) { res.json({ error: 'Missing clientId' }); return }
  try {
    const cd = scanClients(PROJECT_ROOT)
    const cl = cd.clients.find(c => c.id === clientId)
    if (!cl) { res.json({ error: 'Not found' }); return }
    const crm = readJSON(resolve(DATA_DIR, 'crm.json')) || { contracts: [] }
    const store = readJSON(resolve(DATA_DIR, 'analytics.json')) || {}
    const contracts = (crm.contracts || []).filter((c: any) => c.clientId === clientId)
    const active = contracts.find((c: any) => c.status === 'active')
    const retainer = active?.monthlyValue || 0
    const now = new Date()
    const mp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
    const posts = cl.posts.filter(p => p.date.startsWith(mp)).length || cl.stats.total || 1
    const a = store[clientId as string]
    const eng = a?.combined?.totalEngagement || 0
    const cpp = retainer > 0 ? Math.round(retainer / posts) : 0
    const cpe = retainer > 0 && eng > 0 ? Math.round((retainer / eng) * 100) / 100 : 0
    const adVal = Math.round(eng * 0.15)
    const roi = retainer > 0 ? Math.round(((adVal - retainer) / retainer) * 100) : 0
    res.json({ clientId, monthlyRetainer: retainer, postsDelivered: posts, costPerPost: cpp, totalEngagement: eng, costPerEngagement: cpe, estimatedAdValue: adVal, roi })
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

// ══════════════════════════════════════════════════════════
// 9. Agency Metrics
// ══════════════════════════════════════════════════════════
router.get('/agency-metrics', (_req, res) => {
  try {
    const cd = scanClients(PROJECT_ROOT)
    const crm = readJSON(resolve(DATA_DIR, 'crm.json')) || { contracts: [] }
    const now = new Date()
    const mp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
    const activeContracts = (crm.contracts || []).filter((c: any) => c.status === 'active')
    const mrr = activeContracts.reduce((s: number, c: any) => s + (c.monthlyValue || 0), 0)
    let postsThisMonth = 0, totalPosts = 0
    const status: Record<string, number> = { draft: 0, approved: 0, scheduled: 0, published: 0 }
    const pm = new Map<string, number>()
    const breakdown = cd.clients.map(cl => {
      const mp2 = cl.posts.filter(p => p.date.startsWith(mp)).length
      postsThisMonth += mp2; totalPosts += cl.stats.total
      status.draft += cl.stats.draft; status.approved += cl.stats.approved
      status.scheduled += cl.stats.scheduled; status.published += cl.stats.published
      for (const p of cl.posts) { if (p.pillar) { const k = p.pillar.toLowerCase().trim(); pm.set(k, (pm.get(k)||0)+1) } }
      const c = activeContracts.find((c: any) => c.clientId === cl.id)
      return { clientId: cl.id, displayName: cl.displayName, color: cl.color, posts: mp2, healthScore: 0, mrr: c?.monthlyValue || 0 }
    })
    const pt = Array.from(pm.values()).reduce((s,v)=>s+v,0)
    const pillarBalance = Array.from(pm.entries()).map(([p,c])=>({ pillar:p, count:c, percentage: pt>0?Math.round((c/pt)*1000)/10:0, color: PILLAR_COLORS[p]||'#64748b' })).sort((a,b)=>b.count-a.count)
    res.json({ totalClients: cd.clients.length, totalPosts, postsThisMonth, mrr, avgHealthScore: 0, clientBreakdown: breakdown, pillarBalance, statusBreakdown: status })
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

// ══════════════════════════════════════════════════════════
// 10. Onboarding
// ══════════════════════════════════════════════════════════
router.post('/onboard', (req, res) => {
  const { companyName, website, industry, targetAudience, tone, competitors, services } = req.body
  if (!companyName) { res.status(400).json({ error: 'Missing companyName' }); return }
  const prompt = `You are a brand strategist for Epic Digital Hub (Romanian agency).

New client: **${companyName}**
${industry ? `Industry: ${industry}` : ''}${website ? ` | Website: ${website}` : ''}
${targetAudience ? `Target: ${targetAudience}` : ''}${tone ? ` | Tone: ${tone}` : ''}
${competitors ? `Competitors: ${competitors}` : ''}${services ? ` | Services: ${services}` : ''}

Generate in Romanian (proper diacritics ă,â,î,ș,ț):
1. **Brand Voice Guide** — tone description, 5 do's/don'ts, example phrases
2. **Content Pillars** (4-5) — name, description, example post, % allocation
3. **Buyer Persona** — demographics, pain points, goals, online habits
4. **First Month Calendar** — 12 posts (3/week), each: date, platform, pillar, caption idea, visual
5. **Hashtag Strategy** — 10 core + 10 industry + 5 community`
  runClaude(res, prompt)
})

// ══════════════════════════════════════════════════════════
// 11. White-Label
// ══════════════════════════════════════════════════════════
const WL_FILE = resolve(DATA_DIR, 'white-label.json')
router.get('/white-label', (_req, res) => {
  res.json(readJSON(WL_FILE) || { agencyName: 'Epic Digital Hub', agencyLogo: '', primaryColor: '#7c3aed', secondaryColor: '#06b6d4', footerText: 'Raport generat de Epic Digital Hub' })
})
router.put('/white-label', (req, res) => { writeJSON(WL_FILE, req.body); res.json({ success: true }) })

export default router
