import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';
dotenv.config();
let app;
if (!getApps().length) {
    try {
        const serviceAccountPath = resolve(process.cwd(), 'serviceAccountKey.json');
        if (existsSync(serviceAccountPath)) {
            const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
            app = initializeApp({
                credential: cert(serviceAccount),
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`
            });
            console.log('✅ Firebase Admin initialized with serviceAccountKey.json');
        }
        else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            app = initializeApp({
                credential: cert(serviceAccount),
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`
            });
            console.log('✅ Firebase Admin initialized with FIREBASE_SERVICE_ACCOUNT env var');
        }
        else {
            console.warn('⚠️ No Firebase service account found. Firestore/Auth will fail if called. Please add serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT env var.');
            app = initializeApp();
        }
    }
    catch (error) {
        console.error('❌ Error initializing Firebase Admin:', error);
        app = initializeApp();
    }
}
else {
    app = getApps()[0];
}
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
