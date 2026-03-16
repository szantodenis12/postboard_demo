import { db } from './firebase.ts'
import { scanClients } from './scanner.ts'
import { resolve } from 'path'
import { readFileSync, existsSync } from 'fs'

const PROJECT_ROOT = resolve(import.meta.dirname, '..', '..', '..')

const STATUSES_FILE = resolve(import.meta.dirname, '..', 'data', 'statuses.json')
const CAPTIONS_FILE = resolve(import.meta.dirname, '..', 'data', 'captions.json')
const DATES_FILE = resolve(import.meta.dirname, '..', 'data', 'dates.json')
const HIDDEN_FILE = resolve(import.meta.dirname, '..', 'data', 'hidden.json')
const POST_PUBLISH_OPTIONS_FILE = resolve(import.meta.dirname, '..', 'data', 'post-publish-options.json')
const PAGE_MAPPING_FILE = resolve(import.meta.dirname, '..', 'data', 'page-mapping.json')

function readJsonFile(filePath: string, fallback: any = {}) {
  try {
    if (existsSync(filePath)) {
      return JSON.parse(readFileSync(filePath, 'utf-8'))
    }
  } catch (error) {
    console.warn(`Could not read ${filePath}`)
  }
  return fallback
}

export async function runMigration() {
  console.log('🚀 Starting Firebase migration...')

  // 1. Read existing overrides
  const statusOverrides = readJsonFile(STATUSES_FILE, {})
  const captionOverrides = readJsonFile(CAPTIONS_FILE, {})
  const dateOverrides = readJsonFile(DATES_FILE, {})
  const publishOptions = readJsonFile(POST_PUBLISH_OPTIONS_FILE, {})
  const hiddenPosts = new Set(readJsonFile(HIDDEN_FILE, []))
  const pageMappings = readJsonFile(PAGE_MAPPING_FILE, {})

  // 2. Scan clients from disk
  console.log('Scanning clients from disk...')
  const data = scanClients(PROJECT_ROOT)

  const batch = db.batch()
  let operationCount = 0

  async function commitBatchIfNeeded() {
    if (operationCount >= 400) {
      await batch.commit()
      console.log('Committed a batch of operations...')
      operationCount = 0
    }
  }

  // 3. Migrate Clients and Posts
  for (const client of data.clients) {
    console.log(`Migrating client: ${client.name}...`)
    
    // Write client document
    const clientRef = db.collection('clients').doc(client.id)
    batch.set(clientRef, {
      name: client.name,
      displayName: client.displayName,
      color: client.color,
      pageMappingId: pageMappings[client.id] || null,
      stats: client.stats, // Optional: might become obsolete if computed dynamically
      files: client.files
    }, { merge: true })
    operationCount++
    await commitBatchIfNeeded()

    // Write posts
    for (const post of client.posts) {
      if (hiddenPosts.has(post.id)) continue;

      const postRef = db.collection('posts').doc(post.id)
      
      const status = statusOverrides[post.id] || post.status
      const caption = captionOverrides[post.id]?.caption !== undefined ? captionOverrides[post.id].caption : post.caption
      const hashtags = captionOverrides[post.id]?.hashtags !== undefined ? captionOverrides[post.id].hashtags : post.hashtags
      const date = dateOverrides[post.id] || post.date
      const requiresInstagramMusic = publishOptions[post.id]?.requiresInstagramMusic || false

      batch.set(postRef, {
        ...post,
        status,
        caption,
        hashtags,
        date,
        requiresInstagramMusic,
        hidden: false
      }, { merge: true })
      
      operationCount++
      await commitBatchIfNeeded()
    }
  }

  // Final commit
  if (operationCount > 0) {
    await batch.commit()
  }

  console.log('✅ Migration to Firestore complete!')
}

// Run if called directly
if (process.argv[1]?.includes('migrate-to-firebase')) {
  runMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
