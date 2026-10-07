import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

// Validate Connection safely
async function testConnection() {
  try {
    if (typeof window !== 'undefined' && window.localStorage?.getItem('firestore_quota_exceeded_time')) {
      return;
    }
    await getDocFromServer(doc(db, 'system', 'connection_test'));
  } catch {
    // Client offline or quota limit check - silently handle
  }
}
testConnection();
