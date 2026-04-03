import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const serviceAccountPath = resolve('serviceAccountKey.json');
if (!existsSync(serviceAccountPath)) {
  console.error('Missing serviceAccountKey.json');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

// Read .env for bucket name
const envFile = readFileSync('.env', 'utf8');
const bucketMatch = envFile.match(/FIREBASE_STORAGE_BUCKET=(.+)/);
const bucketName = bucketMatch ? bucketMatch[1].trim() : null;

if (!bucketName) {
  console.error('FIREBASE_STORAGE_BUCKET not found in .env');
  process.exit(1);
}

console.log(`Using bucket: ${bucketName}`);

const app = initializeApp({
  credential: cert(serviceAccount),
  storageBucket: bucketName
});

async function testUpload() {
  try {
    const storage = getStorage(app);
    const bucket = storage.bucket();
    const fileName = `test-${Date.now()}.txt`;
    const file = bucket.file(fileName);
    
    console.log(`Attempting to upload ${fileName}...`);
    await file.save('Hello Firebase Storage!', {
      metadata: { contentType: 'text/plain' },
    });
    console.log('Upload successful!');
    
    console.log('Attempting to make public...');
    await file.makePublic();
    console.log(`Public URL: https://storage.googleapis.com/${bucketName}/${fileName}`);
    
    console.log('Cleanup: deleting test file...');
    await file.delete();
    console.log('Cleanup successful!');
    
    process.exit(0);
  } catch (error) {
    console.error('Test FAILED:', error);
    process.exit(1);
  }
}

testUpload();
