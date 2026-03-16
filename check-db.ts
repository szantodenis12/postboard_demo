import { db } from './server/firebase.ts';

async function check() {
  try {
    const clientsSnap = await db.collection('clients').get();
    console.log(`Clients in Firestore: ${clientsSnap.size}`);
    const postsSnap = await db.collection('posts').get();
    console.log(`Posts in Firestore: ${postsSnap.size}`);
  } catch (error) {
    console.error('Error:', error);
  }
}
check();
