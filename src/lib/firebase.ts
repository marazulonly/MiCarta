import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

// Validate Connection safely
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'system', 'connection_test'));
  } catch (error: any) {
    // Client offline or quota limit check - silently handle
  }
}
testConnection();
