import { initializeApp, cert, getApps, App } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { getStorage } from 'firebase-admin/storage'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import dotenv from 'dotenv'

dotenv.config()

let app: App

if (!getApps().length) {
  try {
    const serviceAccountPath = resolve(process.cwd(), 'serviceAccountKey.json')
    
    if (existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'))
      const bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.firebasestorage.app`
      app = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: bucketName
      })
      console.log(`✅ Firebase Admin initialized with serviceAccountKey.json. Bucket: ${bucketName}`)
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      let raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim()
      let serviceAccount: any

      // 1. Try to clean up aggressively escaped strings from App Hosting secrets
      if (raw.startsWith('"') && raw.endsWith('"')) {
        raw = raw.slice(1, -1)
      }
      if (raw.includes('\\"')) {
        raw = raw.replace(/\\"/g, '"')
      }

      // 2. Parse JSON
      try {
        serviceAccount = JSON.parse(raw)
      } catch (err) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', err)
        throw new Error('Invalid JSON in FIREBASE_SERVICE_ACCOUNT')
      }

      // 3. Fix private_key newlines (CRITICAL for 401 Unauthorized errors)
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n')
      }

      const bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.firebasestorage.app`
      app = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: bucketName
      })
      console.log(`✅ Firebase Admin initialized with FIREBASE_SERVICE_ACCOUNT env var. Bucket: ${bucketName}`)
    } else {
      console.warn('⚠️ No Firebase service account found. Firestore/Auth will fail if called. Please add serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT env var.')
      app = initializeApp() 
    }
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error)
    app = initializeApp()
  }
} else {
  app = getApps()[0]
}

const firestore = getFirestore(app)
firestore.settings({ ignoreUndefinedProperties: true })
export const db = firestore
export const auth = getAuth(app)
export const storage = getStorage(app)
