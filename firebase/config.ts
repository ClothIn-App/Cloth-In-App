// firebase/config.ts
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// (Optional, web‑only) Analytics guard so it doesn't break on native
// You can delete this block if you don't need analytics yet.
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyChnoc92SPG8k7QU2-Ml6nq1Zh0hVJ0v54',
  authDomain: 'cloth-in-9a65b.firebaseapp.com',
  projectId: 'cloth-in-9a65b',
  storageBucket: 'cloth-in-9a65b.firebasestorage.app',
  messagingSenderId: '1019492049419',
  appId: '1:1019492049419:web:7280d1bcb8959f29421d0e',
  measurementId: 'G-FG8JW4CEZG',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth + Firestore exports you’ll use in the app
export const auth = getAuth(app);
export const db = getFirestore(app);

// Safe analytics init (web only)
if (typeof window !== 'undefined') {
  isSupported().then((ok) => {
    if (ok) getAnalytics(app);
  });
}
