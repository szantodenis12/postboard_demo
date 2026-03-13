import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, relative, basename } from 'path'
import matter from 'gray-matter'

// ── Types ────────────────────────────────────────────────
type Platform = 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'google' | 'stories'
type PostStatus = 'draft' | 'approved' | 'scheduled' | 'published'
type PostFormat = 'single-image' | 'carousel' | 'reel' | 'video' | 'stories' | 'text'

interface Post {
  id: string
  clientId: string
  clientName: string
  date: string
  time?: string
  platform: Platform
  format: PostFormat
  pillar?: string
  caption: string
  visualDescription?: string
  cta?: string
  hashtags: string[]
  status: PostStatus
  sourceFile: string
}

interface ContentFile {
  path: string
  relativePath: string
  clientId: string
  type: string
  priority: string
  lastUpdated: string
  summary: string
  postCount: number
}

interface Client {
  id: string
  name: string
  displayName: string
  color: string
  posts: Post[]
  files: ContentFile[]
  stats: {
    total: number
    draft: number
    approved: number
    scheduled: number
    published: number
    platforms: Record<Platform, number>
  }
}

// ── Client colors palette ────────────────────────────────
const CLIENT_COLORS = [
  '#7c3aed', '#06b6d4', '#f97316', '#ec4899', '#10b981', '#3b82f6',
  '#f43f5e', '#8b5cf6', '#14b8a6', '#eab308', '#6366f1', '#ef4444',
]

// ── Day names in Romanian ────────────────────────────────
const RO_DAYS = 'LUNI|MARȚI|MARTI|MIERCURI|JOI|VINERI|SÂMBĂTĂ|SAMBATA|DUMINICĂ|DUMINICA'
const RO_MONTHS: Record<string, string> = {
  ianuarie: '01',
  februarie: '02',
  martie: '03',
  aprilie: '04',
  mai: '05',
  iunie: '06',
  iulie: '07',
  august: '08',
  septembrie: '09',
  octombrie: '10',
  noiembrie: '11',
  decembrie: '12',
}

interface ParsedSubsection {
  heading: string
  normalizedHeading: string
  content: string
}

// ── Helpers ──────────────────────────────────────────────
function findMarkdownFiles(dir: string): string[] {
  const files: string[] = []
  if (!existsSync(dir)) return files
  try {
    const entries = readdirSync(dir)
    for (const entry of entries) {
      const fullPath = join(dir, entry)
      try {
        const stat = statSync(fullPath)
        if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
          files.push(...findMarkdownFiles(fullPath))
        } else if (entry.endsWith('.md')) {
          files.push(fullPath)
        }
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
  return files
}

function normalizeRomanianText(value: string): string {
  return value
    .toLowerCase()
    .replace(/ţ/g, 'ț')
    .replace(/ş/g, 'ș')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function stripMarkdown(value: string): string {
  return value
    .replace(/^>\s?/gm, '')
    .replace(/```[\w-]*\n?/g, '')
    .replace(/```/g, '')
    .replace(/`/g, '')
    .replace(/\*\*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function parseDate(dateStr: string, year: number = 2026): string {
  // Handle DD.MM.YYYY first
  const fullMatch = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/)
  if (fullMatch) {
    const day = fullMatch[1].padStart(2, '0')
    const month = fullMatch[2].padStart(2, '0')
    return `${fullMatch[3]}-${month}-${day}`
  }
  // Handle DD.MM — but only valid calendar dates (day 1-31, month 01-12)
  const match = dateStr.match(/\b(\d{1,2})\.(\d{1,2})\b/)
  if (match) {
    const dayNum = parseInt(match[1])
    const monthNum = parseInt(match[2])
    if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12) {
      return `${year}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
    }
  }

  // Handle "Luni, 24 februarie 2026" and similar Romanian written dates
  const normalized = normalizeRomanianText(dateStr)
  const textMatch = normalized.match(
    /(?:luni|marti|miercuri|joi|vineri|sambata|duminica)\s*,?\s*(\d{1,2})\s+(ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie)\s+(\d{4})/
  ) || normalized.match(
    /(\d{1,2})\s+(ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie)\s+(\d{4})/
  )

  if (textMatch) {
    const day = textMatch[1].padStart(2, '0')
    const month = RO_MONTHS[textMatch[2]]
    if (month) return `${textMatch[3]}-${month}-${day}`
  }

  return ''
}

function extractTime(text: string): string | undefined {
  const match = text.match(/(?:Oră|Ora)[:\s]*(\d{1,2}:\d{2})/i)
  if (match) return match[1]
  // Fallback: standalone time pattern after a bullet/dash
  const time2 = text.match(/[-•]\s*(\d{1,2}:\d{2})\b/)
  return time2 ? time2[1] : undefined
}

function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\wăâîșțĂÂÎȘȚ]+/g)
  return matches ? [...new Set(matches.map(t => t.slice(1)))] : []
}

function detectPlatformFromText(text: string, filePath: string): Platform {
  const pathLower = filePath.toLowerCase()
  if (pathLower.includes('/instagram/')) return 'instagram'
  if (pathLower.includes('/facebook/')) return 'facebook'
  if (pathLower.includes('/linkedin/')) return 'linkedin'
  if (pathLower.includes('/tiktok/')) return 'tiktok'
  if (pathLower.includes('/google/')) return 'google'

  const lower = text.toLowerCase()
  if (/\bstories?\b/i.test(lower) && !/post/i.test(lower)) return 'stories'
  if (/\binstagram\b|\bIG\b/i.test(text)) return 'instagram'
  if (/\bfacebook\b|\bFB\b/i.test(text)) return 'facebook'
  if (/\blinkedin\b/i.test(lower)) return 'linkedin'
  if (/\btiktok\b/i.test(lower)) return 'tiktok'
  if (/\bgoogle\s*(business|post|profil)/i.test(lower)) return 'google'

  return 'facebook'
}

function detectFormat(text: string): PostFormat {
  if (/\breel\b/i.test(text)) return 'reel'
  if (/\bcarousel\b|\bcarusel\b/i.test(text)) return 'carousel'
  if (/\bvideo\b/i.test(text)) return 'video'
  if (/\bstories?\b/i.test(text)) return 'stories'
  if (/\btext\b/i.test(text)) return 'text'
  return 'single-image'
}

function detectStatus(text: string): PostStatus {
  if (/publicat|published|✅/i.test(text)) return 'published'
  if (/programat|scheduled|⏳/i.test(text)) return 'scheduled'
  if (/aprobat|approved/i.test(text)) return 'approved'
  return 'draft'
}

/**
 * Extract caption text from a section.
 * Priority: code blocks > labeled blockquotes > labeled paragraphs > inline blockquotes
 */
function extractCaption(section: string): string {
  // 1. Code blocks (```...```)
  const codeBlocks = [...section.matchAll(/```\n?([\s\S]*?)```/g)]
  if (codeBlocks.length > 0) {
    return codeBlocks.map(m => m[1].trim()).join('\n\n')
  }

  // 2. Labeled caption/text sections followed by blockquotes
  const labeledBlock = section.match(
    /(?:Caption|Copy|Text|Mesaj|Descriere)\s*[:]*\s*\n+((?:>.*\n?)+)/i
  )
  if (labeledBlock) {
    return labeledBlock[1].replace(/^>\s?/gm, '').trim()
  }

  // 3. Any substantial blockquote block (but NOT breadcrumbs/navigation)
  const blockquotes = [...section.matchAll(/((?:^>.*\n?)+)/gm)]
  for (const bq of blockquotes) {
    const text = bq[1].replace(/^>\s?/gm, '').trim()
    // Skip breadcrumb navigation and short metadata lines
    if (text.includes('Dosarul') && text.includes('Cuprins')) continue
    if (text.includes('[README') || text.includes('[←')) continue
    if (text.startsWith('**Giveaway:')) continue
    if (text.startsWith('**Titlu:') || text.startsWith('**Text:')) {
      // Google Business structured block — extract the text part
      const gText = text.match(/\*\*Text:\*\*\s*(.*)/s)
      if (gText) return gText[1].trim()
    }
    if (text.length > 30) return text
  }

  // 4. Labeled inline caption
  const inlineCaption = section.match(
    /(?:Caption|Copy|Text|Mesaj)\s*[:]\s*\n*((?:(?!^\*\*|^#{1,4}\s|^---).+\n?)+)/im
  )
  if (inlineCaption && inlineCaption[1].trim().length > 20) {
    return inlineCaption[1].trim()
  }

  return ''
}

function extractPillar(section: string): string | undefined {
  const match = section.match(/(?:Pilon|Pillar|Categorie|Temă)\s*[:]\s*(.+)/i)
  return match ? match[1].replace(/\*\*/g, '').trim() : undefined
}

function extractVisual(section: string): string | undefined {
  const match = section.match(/(?:Vizual|Visual)\s*[:]\s*(.+)/i)
  return match ? match[1].replace(/\*\*/g, '').trim() : undefined
}

function extractCta(section: string): string | undefined {
  const match = section.match(/(?:CTA|Call.to.action)\s*(?:Button)?\s*[:]\s*(.+)/i)
  return match ? match[1].replace(/\*\*/g, '').trim() : undefined
}

function parseSubsections(section: string): ParsedSubsection[] {
  const subsections: ParsedSubsection[] = []
  const lines = section.split('\n')
  let current: { heading: string; normalizedHeading: string; lines: string[] } | null = null

  for (const line of lines) {
    const headingMatch = line.match(/^#{3,4}\s+(.+)$/)
    if (headingMatch) {
      if (current) {
        subsections.push({
          heading: current.heading,
          normalizedHeading: current.normalizedHeading,
          content: current.lines.join('\n').trim(),
        })
      }

      const heading = headingMatch[1].trim()
      current = {
        heading,
        normalizedHeading: normalizeRomanianText(heading),
        lines: [],
      }
      continue
    }

    if (current) current.lines.push(line)
  }

  if (current) {
    subsections.push({
      heading: current.heading,
      normalizedHeading: current.normalizedHeading,
      content: current.lines.join('\n').trim(),
    })
  }

  return subsections
}

function findSubsection(subsections: ParsedSubsection[], headings: string[]): ParsedSubsection | undefined {
  const normalizedHeadings = headings.map(normalizeRomanianText)
  return subsections.find(block =>
    normalizedHeadings.some(prefix => block.normalizedHeading.startsWith(prefix))
  )
}

function extractTableField(section: string, labels: string[]): string | undefined {
  for (const label of labels) {
    const pattern = new RegExp(
      `^\\|\\s*\\*{0,2}${escapeRegExp(label)}\\*{0,2}\\s*\\|\\s*(.+?)\\s*\\|\\s*$`,
      'im'
    )
    const match = section.match(pattern)
    if (match) return stripMarkdown(match[1])
  }
  return undefined
}

function extractSubsectionText(block?: ParsedSubsection): string {
  if (!block?.content) return ''
  const extracted = extractCaption(block.content)
  if (extracted && extracted.length >= 10) return stripMarkdown(extracted)
  return stripMarkdown(block.content)
}

// ── Post extraction strategies ───────────────────────────

/**
 * Strategy A: "POST N" / "POSTAREA N" format (DentalNet, Agro Salso, ThermX)
 * Posts separated by ### or ## headers with POST/POSTAREA + number
 */
function extractByPostHeaders(content: string, filePath: string, clientId: string, clientName: string): Post[] {
  const posts: Post[] = []
  // Match ## POSTAREA N or ### POST N headers
  const postSections = content.split(/(?=^#{2,3}\s+(?:POST(?:AREA)?)\s+\d)/mi)

  for (const section of postSections) {
    const header = section.match(/^#{2,3}\s+(?:POST(?:AREA)?)\s+\d+\s*[—–-]\s*(.+)/im)
    if (!header) continue

    const headerText = header[1]
    const date = parseDate(headerText) || parseDate(section.slice(0, 500))
    if (!date) continue

    const caption = extractCaption(section)
    if (!caption || caption.length < 15) continue

    // Detect platform from **Platforma:** or header text
    const platformField = section.match(/\*\*Platforma?:\*\*\s*(.+)/i)
    const platformText = platformField ? platformField[1] : headerText
    const platform = detectPlatformFromText(platformText, filePath)

    // Detect format from **Tip:** or header
    const tipField = section.match(/\*\*Tip:\*\*\s*(.+)/i)
    const formatText = tipField ? tipField[1] : headerText
    const format = detectFormat(formatText)

    posts.push({
      id: `${clientId}-${basename(filePath, '.md')}-${posts.length + 1}`,
      clientId,
      clientName,
      date,
      time: extractTime(section),
      platform,
      format,
      pillar: extractPillar(section),
      caption: caption.replace(/\*\*/g, '').replace(/\n{3,}/g, '\n\n').trim(),
      visualDescription: extractVisual(section),
      cta: extractCta(section),
      hashtags: extractHashtags(caption),
      status: detectStatus(section),
      sourceFile: filePath,
    })

    // Check for Google Business Post within the same section
    const googleSection = section.match(/\*\*Google\s*Business\s*Post:\*\*\s*\n*((?:>.*\n?)+)/i)
    if (googleSection) {
      const gCaption = googleSection[1].replace(/^>\s?/gm, '').trim()
      if (gCaption.length > 20) {
        posts.push({
          id: `${clientId}-${basename(filePath, '.md')}-${posts.length + 1}`,
          clientId,
          clientName,
          date,
          time: undefined,
          platform: 'google',
          format: 'text',
          pillar: extractPillar(section),
          caption: gCaption.replace(/\*\*/g, '').trim(),
          hashtags: [],
          status: detectStatus(section),
          sourceFile: filePath,
        })
      }
    }
  }

  return posts
}

/**
 * Strategy B: Structured editorial calendar sections (Philatopo)
 * Posts separated by "## Postarea #N", with metadata tables and platform-specific subsections.
 */
function extractByStructuredEditorialSections(content: string, filePath: string, clientId: string, clientName: string): Post[] {
  const posts: Post[] = []
  const postSections = content.split(/(?=^#{2,3}\s+postarea\s*#?\d+)/gmi)

  for (const section of postSections) {
    const header = section.match(/^#{2,3}\s+postarea\s*#?(\d+)\s*[—–-]\s*(.+)$/im)
    if (!header) continue

    const dateField = extractTableField(section, ['Data'])
    const date = parseDate(dateField || header[2] || section.slice(0, 500))
    if (!date) continue

    const pillar = extractTableField(section, ['Pilon', 'Pillar']) || extractPillar(section)
    const formatField = extractTableField(section, ['Format', 'Tip']) || header[2]
    const baseFormat = detectFormat(formatField || section)
    const subsections = parseSubsections(section)
    const visualDescription = stripMarkdown(findSubsection(subsections, ['Descriere Vizuală', 'Vizual'])?.content || '')
    const cta = stripMarkdown(findSubsection(subsections, ['CTA'])?.content || '')
    const explicitHashtags = extractHashtags(findSubsection(subsections, ['Hashtag-uri', 'Hashtags'])?.content || '')

    const buildHashtags = (caption: string) =>
      [...new Set([...explicitHashtags, ...extractHashtags(caption)])]

    const pushPost = (platform: Platform, caption: string, format: PostFormat = baseFormat) => {
      const cleanedCaption = stripMarkdown(caption)
      if (!cleanedCaption || cleanedCaption.length < 15) return

      posts.push({
        id: `${clientId}-${basename(filePath, '.md')}-${posts.length + 1}`,
        clientId,
        clientName,
        date,
        time: extractTime(section),
        platform,
        format,
        pillar,
        caption: cleanedCaption.replace(/\n{3,}/g, '\n\n').trim(),
        visualDescription: visualDescription || undefined,
        cta: cta || undefined,
        hashtags: buildHashtags(cleanedCaption),
        status: detectStatus(section),
        sourceFile: filePath,
      })
    }

    const primaryBlock = findSubsection(subsections, [
      'Caption FB / IG',
      'Caption FB/IG',
      'Caption IG / FB',
      'Caption Instagram / Facebook',
      'Caption Facebook / Instagram',
      'Caption Facebook',
      'Caption Instagram',
    ])

    if (primaryBlock) {
      const primaryCaption = extractSubsectionText(primaryBlock)
      pushPost('facebook', primaryCaption)
      pushPost('instagram', primaryCaption)
    }

    const linkedInBlock = findSubsection(subsections, ['Caption LinkedIn'])
    if (linkedInBlock) {
      pushPost('linkedin', extractSubsectionText(linkedInBlock), detectFormat(linkedInBlock.heading))
    }

    const googleBlock = findSubsection(subsections, [
      'Adaptare Google Business',
      'Google Business',
      'Google Post',
      'Adaptare Google',
    ])
    if (googleBlock) {
      pushPost('google', extractSubsectionText(googleBlock), 'text')
    }
  }

  return posts
}

/**
 * Strategy C: Day-based format (Hotel Maxim)
 * Days as #### DAY_NAME DD.MM, then platform sub-posts as **IG — ..., **FB — ..., **Stories:, **Google Post
 */
function extractByDayHeaders(content: string, filePath: string, clientId: string, clientName: string): Post[] {
  const posts: Post[] = []
  const dayPattern = new RegExp(`^####?\\s+(?:${RO_DAYS})\\s+(\\d{1,2}\\.\\d{1,2})`, 'gmi')

  // Split content by day headers
  const daySections = content.split(new RegExp(`(?=^####?\\s+(?:${RO_DAYS})\\s+\\d{1,2}\\.\\d{1,2})`, 'gmi'))

  for (const daySection of daySections) {
    const dayHeader = daySection.match(new RegExp(`^####?\\s+((?:${RO_DAYS})\\s+(\\d{1,2}\\.\\d{1,2}))\\s*[—–-]?\\s*(.*)`, 'mi'))
    if (!dayHeader) continue

    const date = parseDate(dayHeader[2])
    if (!date) continue
    const dayDescription = dayHeader[3] || ''

    // Split day into platform sub-sections
    // Match: **IG — ..., **FB — ..., **Stories:, **Google Post
    const platformSplits = daySection.split(/(?=^\*\*(?:IG|FB|Instagram|Facebook|Stories|Google)\s*[—–:-])/mi)

    for (const platSection of platformSplits) {
      const platHeader = platSection.match(/^\*\*(?:(IG|Instagram)\s*[—–-]\s*(.+?)|(FB|Facebook)\s*[—–-]\s*(.+?)|Stories\s*[:—–-]|Google\s*(?:Post|Business)\s*[—–:]).*?\*\*/i)
      if (!platHeader) continue

      let platform: Platform
      let formatHint = ''

      if (platHeader[1]) { // IG
        platform = 'instagram'
        formatHint = platHeader[2] || ''
      } else if (platHeader[3]) { // FB
        platform = 'facebook'
        formatHint = platHeader[4] || ''
      } else if (/stories/i.test(platHeader[0])) {
        platform = 'stories'
        formatHint = 'stories'
      } else if (/google/i.test(platHeader[0])) {
        platform = 'google'
        formatHint = 'text'
      } else {
        platform = 'facebook'
      }

      const caption = extractCaption(platSection)
      if (!caption || caption.length < 10) continue

      const format = formatHint
        ? detectFormat(formatHint)
        : detectFormat(platSection)

      posts.push({
        id: `${clientId}-${basename(filePath, '.md')}-${posts.length + 1}`,
        clientId,
        clientName,
        date,
        time: extractTime(platSection),
        platform,
        format,
        pillar: extractPillar(platSection) || extractPillar(daySection.slice(0, 500)),
        caption: caption.replace(/\*\*/g, '').replace(/\n{3,}/g, '\n\n').trim(),
        visualDescription: extractVisual(platSection),
        cta: extractCta(platSection),
        hashtags: extractHashtags(caption),
        status: detectStatus(platSection),
        sourceFile: filePath,
      })
    }
  }

  return posts
}

/**
 * Determine which extraction strategy to use and run it.
 */
function extractPosts(content: string, filePath: string, clientId: string, clientName: string): Post[] {
  // Check which patterns exist in the content
  const hasPostHeaders = /^#{2,3}\s+(?:POST(?:AREA)?)\s+\d/mi.test(content)
  const hasStructuredEditorialHeaders = /^#{2,3}\s+postarea\s*#?\d/mi.test(content)
  const hasDayHeaders = new RegExp(`^####?\\s+(?:${RO_DAYS})\\s+\\d{1,2}\\.\\d{1,2}`, 'mi').test(content)

  let posts: Post[] = []

  if (hasStructuredEditorialHeaders) {
    posts = [...posts, ...extractByStructuredEditorialSections(content, filePath, clientId, clientName)]
  }

  if (hasPostHeaders) {
    posts = [...posts, ...extractByPostHeaders(content, filePath, clientId, clientName)]
  }

  if (hasDayHeaders) {
    posts = [...posts, ...extractByDayHeaders(content, filePath, clientId, clientName)]
  }

  // Deduplicate by date+platform+caption start
  const seen = new Set<string>()
  posts = posts.filter(p => {
    const key = `${p.date}|${p.platform}|${p.caption.slice(0, 50)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return posts
}

// ── Main scanner ─────────────────────────────────────────
export function scanClients(rootPath: string): { clients: Client[], totals: any } {
  const clientiDir = join(rootPath, 'CLIENTI')
  if (!existsSync(clientiDir)) {
    return { clients: [], totals: { clients: 0, posts: 0, draft: 0, approved: 0, scheduled: 0, published: 0 } }
  }

  const clientDirs = readdirSync(clientiDir).filter(d => {
    const fullPath = join(clientiDir, d)
    return statSync(fullPath).isDirectory() && !d.startsWith('.') && d !== '_TEMPLATE'
  })

  const clients: Client[] = []

  clientDirs.forEach((dir, index) => {
    const clientPath = join(clientiDir, dir)
    const contentPath = join(clientPath, 'CONTENT')
    const readmePath = join(clientPath, 'README.md')

    const mdFiles = findMarkdownFiles(contentPath)
    if (mdFiles.length === 0 && !existsSync(readmePath)) return

    const clientId = dir.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const displayName = dir.replace(/_/g, ' ')
    const color = CLIENT_COLORS[index % CLIENT_COLORS.length]

    const allPosts: Post[] = []
    const files: ContentFile[] = []

    if (existsSync(readmePath)) {
      try {
        const rawReadme = readFileSync(readmePath, 'utf-8')
        const { data: frontmatter } = matter(rawReadme)
        files.push({
          path: readmePath,
          relativePath: relative(rootPath, readmePath),
          clientId,
          type: frontmatter.type || 'readme',
          priority: frontmatter.priority || 'critical',
          lastUpdated: frontmatter['last-updated'] || '',
          summary: frontmatter.summary || `README pentru ${displayName}`,
          postCount: 0,
        })
      } catch {
        files.push({
          path: readmePath,
          relativePath: relative(rootPath, readmePath),
          clientId,
          type: 'readme',
          priority: 'critical',
          lastUpdated: '',
          summary: `README pentru ${displayName}`,
          postCount: 0,
        })
      }
    }

    for (const filePath of mdFiles) {
      try {
        const raw = readFileSync(filePath, 'utf-8')
        const { data: frontmatter, content } = matter(raw)

        // Only process social media content and editorial calendars
        const fileType = (frontmatter.type || '').toLowerCase()
        const isRelevant =
          fileType.includes('social') ||
          fileType.includes('editorial') ||
          fileType.includes('content') ||
          filePath.toLowerCase().includes('social_media') ||
          filePath.toLowerCase().includes('calendar_editorial') ||
          filePath.toLowerCase().includes('postari') ||
          filePath.toLowerCase().includes('batch')

        if (!isRelevant) continue

        const posts = extractPosts(content, filePath, clientId, displayName)
        allPosts.push(...posts)

        files.push({
          path: filePath,
          relativePath: relative(rootPath, filePath),
          clientId,
          type: frontmatter.type || 'unknown',
          priority: frontmatter.priority || 'medium',
          lastUpdated: frontmatter['last-updated'] || '',
          summary: frontmatter.summary || basename(filePath, '.md'),
          postCount: posts.length,
        })
      } catch {
        // Skip files that can't be parsed
      }
    }

    if (allPosts.length === 0 && files.length === 0) return

    // Calculate stats
    const platforms: Record<Platform, number> = {
      facebook: 0, instagram: 0, linkedin: 0, tiktok: 0, google: 0, stories: 0,
    }
    let draft = 0, approved = 0, scheduled = 0, published = 0

    for (const post of allPosts) {
      platforms[post.platform] = (platforms[post.platform] || 0) + 1
      switch (post.status) {
        case 'draft': draft++; break
        case 'approved': approved++; break
        case 'scheduled': scheduled++; break
        case 'published': published++; break
      }
    }

    clients.push({
      id: clientId,
      name: dir,
      displayName,
      color,
      posts: allPosts,
      files,
      stats: {
        total: allPosts.length,
        draft, approved, scheduled, published,
        platforms,
      },
    })
  })

  // Sort by post count descending
  clients.sort((a, b) => b.stats.total - a.stats.total)

  const totals = {
    clients: clients.length,
    posts: clients.reduce((sum, c) => sum + c.stats.total, 0),
    draft: clients.reduce((sum, c) => sum + c.stats.draft, 0),
    approved: clients.reduce((sum, c) => sum + c.stats.approved, 0),
    scheduled: clients.reduce((sum, c) => sum + c.stats.scheduled, 0),
    published: clients.reduce((sum, c) => sum + c.stats.published, 0),
  }

  return { clients, totals }
}
