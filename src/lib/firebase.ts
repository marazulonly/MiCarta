import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, setLogLevel } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence verbose internal retry logs during quota exhaustion
try {
  setLogLevel('silent');
} catch {}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

let firebaseStorageInstance: ReturnType<typeof getStorage> | null = null;
try {
  firebaseStorageInstance = getStorage(
    app,
    firebaseConfig.storageBucket ? `gs://${firebaseConfig.storageBucket}` : undefined
  );
} catch (e) {
  console.warn('[Firebase] Storage initialization notice:', e);
}

export const storage = firebaseStorageInstance;

