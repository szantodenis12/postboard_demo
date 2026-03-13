import { existsSync, readFileSync, readdirSync, statSync } from 'fs'
import { basename, join, relative } from 'path'
import matter from 'gray-matter'
import { scanClients } from './scanner.ts'

type ContextUseFor =
  | 'ads'
  | 'social-media'
  | 'email'
  | 'blog'
  | 'seo'
  | 'website'
  | 'strategy'
  | 'campaign-planning'
  | 'content-creation'
  | 'reports'
  | 'all'

type DocumentPriority = 'critical' | 'high' | 'medium' | 'low'

export type ClientContextTask =
  | 'ads'
  | 'social-media'
  | 'email'
  | 'seo'
  | 'website'
  | 'strategy'
  | 'campaign-planning'
  | 'content-creation'
  | 'reports'

export interface BuildClientContextOptions {
  task?: ClientContextTask
  query?: string
  includeRecentPosts?: boolean
  maxFullDocs?: number
  maxReferenceDocs?: number
}

export interface ClientContextSource {
  relativePath: string
  type: string
  priority: DocumentPriority
}

export interface ClientContextPackage {
  context: string
  loadedSources: ClientContextSource[]
  referenceSources: ClientContextSource[]
}

interface ClientDocument {
  path: string
  relativePath: string
  type: string
  useFor: ContextUseFor[]
  priority: DocumentPriority
  lastUpdated: string
  summary: string
  title: string
  isReadme: boolean
  content: string
}

interface TaskRule {
  useFor: ContextUseFor[]
  criticalTypes: string[]
  maxFullDocs: number
  maxReferenceDocs: number
  includeRecentPosts: boolean
}

const TASK_RULES: Record<ClientContextTask, TaskRule> = {
  ads: {
    useFor: ['ads', 'content-creation'],
    criticalTypes: ['readme', 'buyer-persona', 'brand-identity', 'brand-technical'],
    maxFullDocs: 5,
    maxReferenceDocs: 8,
    includeRecentPosts: true,
  },
  'social-media': {
    useFor: ['social-media', 'content-creation'],
    criticalTypes: ['readme', 'buyer-persona', 'brand-identity', 'content-template', 'brand-technical'],
    maxFullDocs: 5,
    maxReferenceDocs: 8,
    includeRecentPosts: true,
  },
  email: {
    useFor: ['email', 'content-creation'],
    criticalTypes: ['readme', 'buyer-persona', 'brand-identity'],
    maxFullDocs: 4,
    maxReferenceDocs: 6,
    includeRecentPosts: false,
  },
  seo: {
    useFor: ['blog', 'seo'],
    criticalTypes: ['readme', 'brand-technical', 'brand-alignment'],
    maxFullDocs: 4,
    maxReferenceDocs: 6,
    includeRecentPosts: false,
  },
  website: {
    useFor: ['website'],
    criticalTypes: ['readme', 'brand-identity', 'website-assets'],
    maxFullDocs: 4,
    maxReferenceDocs: 6,
    includeRecentPosts: false,
  },
  strategy: {
    useFor: ['strategy', 'campaign-planning', 'reports'],
    criticalTypes: ['readme', 'buyer-persona', 'market-analysis', 'competitor-analysis', 'digital-strategy', 'editorial-calendar'],
    maxFullDocs: 6,
    maxReferenceDocs: 10,
    includeRecentPosts: true,
  },
  'campaign-planning': {
    useFor: ['campaign-planning', 'social-media', 'content-creation'],
    criticalTypes: ['readme', 'buyer-persona', 'digital-strategy', 'editorial-calendar', 'brand-identity'],
    maxFullDocs: 6,
    maxReferenceDocs: 10,
    includeRecentPosts: true,
  },
  'content-creation': {
    useFor: ['content-creation', 'social-media'],
    criticalTypes: ['readme', 'buyer-persona', 'brand-identity', 'brand-technical'],
    maxFullDocs: 5,
    maxReferenceDocs: 8,
    includeRecentPosts: true,
  },
  reports: {
    useFor: ['reports', 'strategy'],
    criticalTypes: ['readme', 'digital-strategy', 'brand-identity', 'buyer-persona'],
    maxFullDocs: 4,
    maxReferenceDocs: 6,
    includeRecentPosts: true,
  },
}

function normalizePriority(value: unknown): DocumentPriority {
  const raw = String(value || '').trim().toLowerCase()
  if (raw === 'critical' || raw === 'high' || raw === 'medium' || raw === 'low') return raw
  return 'medium'
}

function normalizeUseFor(value: unknown): ContextUseFor[] {
  if (Array.isArray(value)) {
    const tags = value
      .map(item => String(item || '').trim().toLowerCase())
      .filter(Boolean) as ContextUseFor[]
    return tags.length > 0 ? tags : ['all']
  }

  if (typeof value === 'string' && value.trim()) {
    const tags = value
      .split(',')
      .map(item => item.trim().toLowerCase())
      .filter(Boolean) as ContextUseFor[]
    return tags.length > 0 ? tags : ['all']
  }

  return ['all']
}

function findMarkdownFiles(dir: string): string[] {
  const files: string[] = []
  if (!existsSync(dir)) return files

  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.')) continue
    if (entry === 'node_modules' || entry === 'dist' || entry === '_PUBLIC') continue

    const fullPath = join(dir, entry)
    let stats
    try {
      stats = statSync(fullPath)
    } catch {
      continue
    }

    if (stats.isDirectory()) {
      files.push(...findMarkdownFiles(fullPath))
      continue
    }

    if (entry.endsWith('.md')) files.push(fullPath)
  }

  return files
}

function resolveClientDir(projectRoot: string, clientId: string): string | null {
  const clientiDir = join(projectRoot, 'CLIENTI')
  if (!existsSync(clientiDir)) return null

  for (const entry of readdirSync(clientiDir)) {
    const fullPath = join(clientiDir, entry)
    let stats
    try {
      stats = statSync(fullPath)
    } catch {
      continue
    }

    if (!stats.isDirectory() || entry.startsWith('.') || entry === '_TEMPLATE') continue

    const normalized = entry.toLowerCase().replace(/[^a-z0-9]/g, '-')
    if (normalized === clientId) return entry
  }

  return null
}

function sanitizeContent(content: string): string {
  return content
    .replace(/^(?:>.*\n)+/m, '')
    .replace(/^---\n+/m, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function readClientDocuments(projectRoot: string, clientId: string): { clientDir: string | null; docs: ClientDocument[] } {
  const clientDir = resolveClientDir(projectRoot, clientId)
  if (!clientDir) return { clientDir: null, docs: [] }

  const clientPath = join(projectRoot, 'CLIENTI', clientDir)
  const docs = findMarkdownFiles(clientPath)
    .map(filePath => {
      try {
        const raw = readFileSync(filePath, 'utf-8')
        const parsed = matter(raw)
        return {
          path: filePath,
          relativePath: relative(projectRoot, filePath),
          type: String(parsed.data.type || '').trim().toLowerCase() || 'unknown',
          useFor: normalizeUseFor(parsed.data['use-for']),
          priority: normalizePriority(parsed.data.priority),
          lastUpdated: String(parsed.data['last-updated'] || '').trim(),
          summary: String(parsed.data.summary || basename(filePath, '.md')).trim(),
          title: String(parsed.data.client || basename(filePath, '.md')).trim(),
          isReadme: basename(filePath).toLowerCase() === 'readme.md' || String(parsed.data.type || '').trim().toLowerCase() === 'readme',
          content: sanitizeContent(parsed.content),
        } satisfies ClientDocument
      } catch {
        return null
      }
    })
    .filter(Boolean) as ClientDocument[]

  docs.sort((a, b) => {
    if (a.isReadme) return -1
    if (b.isReadme) return 1
    const priorityOrder: Record<DocumentPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  return { clientDir, docs }
}

function tokenize(text: string): string[] {
  return Array.from(
    new Set(
      String(text || '')
        .toLowerCase()
        .replace(/[^a-z0-9ăâîșț]+/gi, ' ')
        .split(/\s+/)
        .map(token => token.trim())
        .filter(token => token.length >= 4),
    ),
  )
}

function scoreDocument(doc: ClientDocument, rule: TaskRule, queryTokens: string[]): number {
  let score = 0

  if (doc.isReadme) score += 500

  const priorityScore: Record<DocumentPriority, number> = {
    critical: 90,
    high: 60,
    medium: 25,
    low: 10,
  }
  score += priorityScore[doc.priority]

  if (doc.useFor.includes('all')) score += 30
  for (const tag of rule.useFor) {
    if (doc.useFor.includes(tag)) score += 55
  }

  if (rule.criticalTypes.includes(doc.type)) score += 70

  const searchable = `${doc.relativePath} ${doc.type} ${doc.summary}`.toLowerCase()
  for (const token of queryTokens) {
    if (searchable.includes(token)) score += 10
  }

  return score
}

function uniquePush<T extends { path: string }>(items: T[], item: T) {
  if (!items.some(existing => existing.path === item.path)) items.push(item)
}

function getExcerptLimit(doc: ClientDocument): number {
  if (doc.isReadme) return 5000
  if (doc.priority === 'critical') return 3200
  if (doc.priority === 'high') return 2400
  if (doc.priority === 'medium') return 1600
  return 1000
}

function selectDocuments(docs: ClientDocument[], rule: TaskRule, query: string, options: BuildClientContextOptions) {
  const queryTokens = tokenize(query)
  const scoredDocs = docs
    .map(doc => ({ doc, score: scoreDocument(doc, rule, queryTokens) }))
    .sort((a, b) => b.score - a.score)

  const fullDocs: ClientDocument[] = []
  const referenceDocs: ClientDocument[] = []

  const readme = scoredDocs.find(entry => entry.doc.isReadme)?.doc
  if (readme) uniquePush(fullDocs, readme)

  const fullLimit = options.maxFullDocs ?? rule.maxFullDocs
  const referenceLimit = options.maxReferenceDocs ?? rule.maxReferenceDocs

  for (const entry of scoredDocs) {
    if (fullDocs.length >= fullLimit) break
    if (entry.doc.isReadme) continue
    if (entry.score < 70) continue
    uniquePush(fullDocs, entry.doc)
  }

  for (const entry of scoredDocs) {
    if (fullDocs.length >= fullLimit) break
    if (entry.doc.isReadme) continue
    if (entry.score < 40) continue
    uniquePush(fullDocs, entry.doc)
  }

  for (const entry of scoredDocs) {
    if (referenceDocs.length >= referenceLimit) break
    if (entry.score < 20) continue
    if (fullDocs.some(doc => doc.path === entry.doc.path)) continue
    uniquePush(referenceDocs, entry.doc)
  }

  return { fullDocs, referenceDocs }
}

function toSource(doc: ClientDocument): ClientContextSource {
  return {
    relativePath: doc.relativePath,
    type: doc.type,
    priority: doc.priority,
  }
}

export function buildClientContextPackage(projectRoot: string, clientId: string, options: BuildClientContextOptions = {}): ClientContextPackage {
  const task = options.task || 'content-creation'
  const rule = TASK_RULES[task]
  const { clientDir, docs } = readClientDocuments(projectRoot, clientId)
  const scanned = scanClients(projectRoot)
  const client = scanned.clients.find(entry => entry.id === clientId)
  const displayName = client?.displayName || clientDir?.replace(/_/g, ' ') || clientId
  const selected = selectDocuments(docs, rule, options.query || '', options)

  const parts: string[] = []
  parts.push(`# Client: ${displayName}`)

  if (client) {
    parts.push(`Total posts: ${client.stats.total} (draft: ${client.stats.draft}, approved: ${client.stats.approved}, scheduled: ${client.stats.scheduled}, published: ${client.stats.published})`)
    parts.push(`Platforms: ${Object.entries(client.stats.platforms).filter(([, value]) => value > 0).map(([platform, value]) => `${platform}: ${value}`).join(', ')}`)
  } else {
    parts.push('No post history currently indexed in PostBoard for this client.')
  }

  parts.push(`Task focus: ${task}`)
  parts.push('')

  if (selected.fullDocs.length > 0) {
    parts.push('## Loaded internal sources for this request:')
    for (const doc of selected.fullDocs) {
      parts.push(`### ${doc.type} (${doc.relativePath})`)
      parts.push(doc.content.slice(0, getExcerptLimit(doc)).trim())
      parts.push('')
    }
  } else {
    parts.push('## Loaded internal sources for this request:')
    parts.push('No structured brand documents were selected for this task.')
    parts.push('')
  }

  if (selected.referenceDocs.length > 0) {
    parts.push('## Other relevant internal docs available (metadata only):')
    for (const doc of selected.referenceDocs) {
      parts.push(`- ${doc.type} [${doc.priority}] — ${doc.summary} (${doc.relativePath})`)
    }
    parts.push('')
  }

  const includeRecentPosts = options.includeRecentPosts ?? rule.includeRecentPosts
  if (includeRecentPosts && client?.posts?.length) {
    const recent = [...client.posts]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8)

    parts.push('## Recent posts (style and offer reference only):')
    for (const post of recent) {
      parts.push(`- [${post.date}] ${post.platform} (${post.format}) — ${post.caption.slice(0, 220)}`)
      if (post.hashtags.length > 0) parts.push(`  Hashtags: ${post.hashtags.map(tag => `#${tag}`).join(' ')}`)
    }
    parts.push('')
  }

  return {
    context: parts.join('\n').trim(),
    loadedSources: selected.fullDocs.map(toSource),
    referenceSources: selected.referenceDocs.map(toSource),
  }
}

export function buildClientContext(projectRoot: string, clientId: string, options: BuildClientContextOptions = {}): string {
  return buildClientContextPackage(projectRoot, clientId, options).context
}
