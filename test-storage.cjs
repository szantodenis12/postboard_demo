const admin = require('firebase-admin');
const fs = require('fs');
const sa = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'));
admin.initializeApp({
  credential: admin.credential.cert(sa),
  storageBucket: 'new-tix.firebasestorage.app'
});
const bucket = admin.storage().bucket();
console.log('Testing bucket:', bucket.name);
bucket.getFiles({ maxResults: 1 })
  .then(f => console.log('Bucket OK. Files found:', f[0].length))
  .catch(e => console.error('Bucket Error:', e.message));
