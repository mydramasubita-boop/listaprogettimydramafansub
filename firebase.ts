import { initializeApp } from 'firebase/app';
import {
  getFirestore, doc, setDoc, getDoc, onSnapshot, Unsubscribe
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAyG4RRhGVDjgNK9vSBO6yjnt_9isrheeg",
  authDomain: "mydramatv-63779.firebaseapp.com",
  projectId: "mydramatv-63779",
  storageBucket: "mydramatv-63779.firebasestorage.app",
  messagingSenderId: "527358114947",
  appId: "1:527358114947:web:9bf8c2750b277397812fb6"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ── Genera o recupera codice utente univoco ──────────────────────────
export const getUserCode = (): string => {
  let code = localStorage.getItem('mdl_user_code');
  if (!code) {
    // Genera codice tipo "MDL-X7K9P2"
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    code = 'MDL-' + Array.from({ length: 6 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    localStorage.setItem('mdl_user_code', code);
  }
  return code;
};

// ── Struttura dati su Firestore ──────────────────────────────────────
export interface SyncData {
  favorites: string[];
  history: { projectId: string; episodeIndex: number; timestamp: number }[];
  videoPositions: Record<string, number>; // key: "id_progetto_ep"
  updatedAt: number;
}

// ── Salva dati su Firestore ──────────────────────────────────────────
export const saveToFirestore = async (userCode: string, data: SyncData): Promise<void> => {
  try {
    await setDoc(doc(db, 'users', userCode), data);
  } catch (e) {
    console.warn('Firestore save error:', e);
  }
};

// ── Carica dati da Firestore ─────────────────────────────────────────
export const loadFromFirestore = async (userCode: string): Promise<SyncData | null> => {
  try {
    const snap = await getDoc(doc(db, 'users', userCode));
    if (snap.exists()) return snap.data() as SyncData;
    return null;
  } catch (e) {
    console.warn('Firestore load error:', e);
    return null;
  }
};

// ── Ascolta aggiornamenti in tempo reale ─────────────────────────────
export const subscribeToSync = (
  userCode: string,
  callback: (data: SyncData) => void
): Unsubscribe => {
  return onSnapshot(doc(db, 'users', userCode), (snap) => {
    if (snap.exists()) {
      callback(snap.data() as SyncData);
    }
  }, (err) => {
    console.warn('Firestore listener error:', err);
  });
};
