import { spawn, execSync } from 'child_process'
import type { Response } from 'express'
import {
  buildClientContext,
  buildClientContextPackage,
  type BuildClientContextOptions,
  type ClientContextTask,
} from './client-context.js'

// ── Client Context Builder ──────────────────────────────

export function getClientContext(projectRoot: string, clientId: string, options: BuildClientContextOptions = {}): string {
  return buildClientContext(projectRoot, clientId, options)
}

export function getClientContextPackage(projectRoot: string, clientId: string, options: BuildClientContextOptions = {}) {
  return buildClientContextPackage(projectRoot, clientId, options)
}

function buildSystemPrompt(clientContext: string, task: ClientContextTask, options?: { noExternalResearch?: boolean }): string {
  const taskLabels: Record<ClientContextTask, string> = {
    ads: 'paid ads',
    'social-media': 'social media',
    email: 'email marketing',
    seo: 'SEO / blog',
    website: 'website',
    strategy: 'strategy',
    'campaign-planning': 'campaign planning',
    'content-creation': 'content creation',
    reports: 'reporting / analysis',
  }
  const externalResearchRule = options?.noExternalResearch
    ? '- This workflow has NO live web research. If the user asks for current market data, live trends, or competitor research, say that explicit external research is required.'
    : ''

  return `You are a senior social media content strategist for Epic Digital Hub, a marketing agency based in Romania.

RULES:
- ALL content you create MUST be written in Romanian with proper diacritics: ă, â, î, ș, ț
- Write naturally — never generic, robotic, or overly formal
- Use "tu" (informal) for social media content unless specified otherwise
- Adapt tone per platform: professional on LinkedIn, casual on Instagram/TikTok, balanced on Facebook
- Use Romanian number formatting (1.000,00) and date format (DD.MM.YYYY)
- Never use AI-sounding phrases or generic motivational headers
- Be direct, creative, and practical
- Base every factual claim on the verified internal context below or on the user's explicit input
- If the docs do not confirm a fact, say that clearly instead of guessing
- Do NOT invent benchmarks, competitor facts, live trends, prices, technical specs, performance results, or client promises
- When you add a practical idea that is not explicitly documented, label it clearly as "Recomandare"
- Keep facts and recommendations separate when the distinction matters
${externalResearchRule}
TASK:
- Focus on ${taskLabels[task]}

CLIENT CONTEXT:
${clientContext}`
}

// ── SSE Helpers ─────────────────────────────────────────

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

// ── Claude Code CLI Runner ──────────────────────────────

const DEFAULT_MODEL = process.env.POSTBOARD_AI_MODEL || 'sonnet'

function runClaude(res: Response, prompt: string, meta?: { sources?: string[] }) {
  initSSE(res)
  if (meta?.sources && meta.sources.length > 0) {
    sendSSE(res, { type: 'sources', sources: meta.sources })
  }

  const env = { ...process.env, NO_COLOR: '1', CLAUDECODE: '' }
  const proc = spawn('claude', ['-p', '--model', DEFAULT_MODEL], {
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  // Send prompt via stdin to avoid OS argument length limits
  proc.stdin.write(prompt)
  proc.stdin.end()

  // Kill process if client disconnects
  res.on('close', () => {
    if (!proc.killed) proc.kill('SIGTERM')
  })

  proc.stdout.on('data', (chunk: Buffer) => {
    const text = chunk.toString()
    if (text) sendSSE(res, { text })
  })

  proc.stderr.on('data', (chunk: Buffer) => {
    console.error('[claude cli]', chunk.toString().trim())
  })

  proc.on('close', (code) => {
    if (code !== 0 && !res.writableEnded) {
      sendSSE(res, { error: `Claude exited with code ${code}` })
    }
    if (!res.writableEnded) endSSE(res)
  })

  proc.on('error', (err) => {
    if (!res.writableEnded) {
      sendSSE(res, { error: err.message })
      endSSE(res)
    }
  })
}

function inferChatTask(text: string): ClientContextTask {
  const lower = text.toLowerCase()

  if (/(competitor|competitori|concuren|market|piață|pozitionare|poziționare|strategie)/i.test(lower)) return 'strategy'
  if (/(website|site|landing page|landing|pagină|pagina)/i.test(lower)) return 'website'
  if (/(email|newsletter|mail)/i.test(lower)) return 'email'
  if (/(seo|keyword|blog|articol|organic)/i.test(lower)) return 'seo'
  if (/(ads|ad copy|reclam|meta ads|google ads|campanie plătită|headline|primary text)/i.test(lower)) return 'ads'
  if (/(report|raport|analytics|analiz|metric|kpi|engagement|benchmark|performan)/i.test(lower)) return 'reports'
  if (/(calendar|calendar editorial|plan|luna asta|postare|caption|hashtag|brief)/i.test(lower)) return 'social-media'

  return 'content-creation'
}

// ── Chat ────────────────────────────────────────────────

export async function streamChat(
  res: Response,
  projectRoot: string,
  clientId: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
) {
  const lastMessage = messages[messages.length - 1]
  const task = inferChatTask(lastMessage?.content || '')
  const contextPackage = getClientContextPackage(projectRoot, clientId, {
    task,
    query: lastMessage?.content || '',
  })
  const systemPrompt = buildSystemPrompt(contextPackage.context, task, { noExternalResearch: true })

  // Build full prompt with conversation history
  const parts = [systemPrompt, '', '---', '']

  if (messages.length > 1) {
    parts.push('Conversation so far:')
    for (const msg of messages.slice(0, -1)) {
      parts.push(`${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      parts.push('')
    }
    parts.push('---', '')
  }

  parts.push(`User: ${lastMessage.content}`)
  parts.push('')
  parts.push('Respond now in Romanian where appropriate. Use only confirmed internal context for factual claims.')

  runClaude(res, parts.join('\n'), {
    sources: contextPackage.loadedSources.map(source => source.relativePath),
  })
}

// ── Brief Generator ─────────────────────────────────────

export async function streamBrief(
  res: Response,
  projectRoot: string,
  clientId: string,
  platform: string,
  format: string,
  topic: string,
  notes?: string,
) {
  const context = getClientContext(projectRoot, clientId, {
    task: 'social-media',
    query: `${platform} ${format} ${topic} ${notes || ''}`,
  })
  const systemPrompt = buildSystemPrompt(context, 'social-media', { noExternalResearch: true })

  const prompt = `${systemPrompt}

---

Generate a complete content brief for a social media post.

Platform: ${platform}
Format: ${format}
Topic/Theme: ${topic}
${notes ? `Additional notes: ${notes}` : ''}

Create the brief with these sections:
1. **Concept** — the main idea and angle (2-3 sentences)
2. **Caption** — a ready-to-post caption in the client's brand voice
3. **Visual Direction** — what the visual should look like (for designer or Midjourney)
4. **Call to Action** — what should the audience do
5. **Hashtags** — 8-12 relevant hashtags in Romanian
6. **Best Posting Time** — suggest an hour only if it is supported by the internal context; otherwise write exactly: "Nu avem încă date validate pentru ora optimă."

Write everything in Romanian.
If the docs do not confirm a brand or product detail, keep the wording generic instead of inventing specifics.`

  runClaude(res, prompt)
}

// ── Caption Rewriter ────────────────────────────────────

export async function streamRewrite(
  res: Response,
  projectRoot: string,
  clientId: string,
  caption: string,
  platform: string,
  tone?: string,
) {
  const context = getClientContext(projectRoot, clientId, {
    task: 'social-media',
    query: `${platform} ${tone || ''} ${caption}`,
  })
  const systemPrompt = buildSystemPrompt(context, 'social-media', { noExternalResearch: true })

  const prompt = `${systemPrompt}

---

Rewrite this social media caption in 3 different variants for ${platform}.

Original caption:
"""
${caption}
"""

${tone ? `Desired tone: ${tone}` : ''}

For each variant:
1. **Variant 1 — Engaging** — more punchy, with a hook
2. **Variant 2 — Story-driven** — tell a mini story or use a relatable scenario
3. **Variant 3 — Direct & Bold** — short, confident, to the point

Each variant should:
- Be in the client's brand voice (Romanian, with proper diacritics)
- Include a call to action
- End with relevant hashtags (5-8)
- Be optimized for ${platform}
- Avoid inventing product benefits or claims that are not confirmed in the internal docs or in the original caption

Separate each variant clearly.`

  runClaude(res, prompt)
}

// ── Hashtag Suggestions ─────────────────────────────────

export async function streamHashtags(
  res: Response,
  projectRoot: string,
  clientId: string,
  topic: string,
  platform: string,
) {
  const context = getClientContext(projectRoot, clientId, {
    task: 'social-media',
    query: `${platform} ${topic}`,
  })
  const systemPrompt = buildSystemPrompt(context, 'social-media', { noExternalResearch: true })

  const prompt = `${systemPrompt}

---

Suggest hashtags for a ${platform} post about: "${topic}"

Provide:
1. **Core hashtags** (5-6) — directly related to the topic, high relevance
2. **Niche hashtags** (4-5) — specific to the Romanian market and client's industry
3. **Community / Reach Extension** (3-4) — broader but still relevant hashtags, without claiming they are currently trending
4. **Branded** (2-3) — existing brand hashtags if they are confirmed in the docs; if not, mark them clearly as "Propunere"

For each hashtag, briefly explain why it's relevant (one line).
All hashtags should be in Romanian where applicable.
Do not claim that a hashtag is "trending" unless that is explicitly confirmed in the internal context.`

  runClaude(res, prompt)
}

// ── Image Prompt Enhancer ──────────────────────────────

export async function streamImagePrompt(
  res: Response,
  visualDescription: string,
  clientName: string,
  platform: string,
  format: string,
  pillar?: string,
) {
  // Determine aspect ratio from platform/format
  const aspectRatio = getAspectRatio(platform, format)

  const prompt = `You are a professional AI image prompt engineer specializing in social media visuals.

Your job: take a rough visual description and transform it into a polished, detailed prompt suitable for Midjourney or DALL-E image generation.

INPUT:
- Client: ${clientName}
- Platform: ${platform}
- Post format: ${format}
- Content pillar: ${pillar || 'not specified'}
- Aspect ratio: ${aspectRatio}
- Raw visual description: "${visualDescription}"

INSTRUCTIONS:
1. Enhance the description with professional photography/design terminology
2. Add specific lighting direction (golden hour, soft diffused, dramatic side-light, etc.)
3. Add composition details (rule of thirds, centered subject, negative space, leading lines, etc.)
4. Specify color palette or mood that fits the brand and platform
5. Add texture/material details where relevant
6. Include style keywords (editorial photography, lifestyle, flat lay, cinematic, etc.)
7. Keep it concise but vivid — maximum 2-3 sentences
8. Do NOT include aspect ratio or Midjourney parameters — those are added separately
9. Do NOT wrap in quotes or add prefixes like "Prompt:"

OUTPUT FORMAT:
First, output the enhanced prompt text (just the prompt, nothing else).
Then on a new line, output exactly this JSON block:
\`\`\`json
{"type":"complete","prompt":"<the exact same enhanced prompt>","aspectRatio":"${aspectRatio}","style":"<one of: photography, illustration, minimalist, bold-graphic, lifestyle>"}
\`\`\`

Write ONLY the prompt and the JSON block. No explanations, no headers, no extra text.`

  runClaude(res, prompt)
}

function getAspectRatio(platform: string, format: string): string {
  if (format === 'stories' || format === 'reel') return '9:16'
  if (platform === 'instagram') return '1:1'
  if (platform === 'facebook') return '16:9'
  if (platform === 'linkedin') return '1.91:1'
  if (platform === 'tiktok') return '9:16'
  return '1:1'
}

// ── Check if Claude Code CLI is available ───────────────

export function isAIConfigured(): boolean {
  try {
    execSync('which claude', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}
