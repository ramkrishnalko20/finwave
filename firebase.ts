import { initializeApp } from 'firebase/app';
import * as FBAuth from 'firebase/auth';
import * as FBFirestore from 'firebase/firestore';

// Note: Replace these with your real Firebase config when ready for production.
const firebaseConfig = {
  apiKey: "AIzaSy-PLACEHOLDER-KEY",
  authDomain: "finwave-invest.firebaseapp.com",
  projectId: "finwave-invest",
  storageBucket: "finwave-invest.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const isPlaceholder = firebaseConfig.apiKey.includes("PLACEHOLDER");

// --- MOCK IMPLEMENTATION ---
const createMockFirebase = () => {
  const listeners: Record<string, Function[]> = {};
  const notify = (path: string) => {
    if (listeners[path]) listeners[path].forEach(cb => cb());
  };

  const mockAuth: any = {
    currentUser: JSON.parse(localStorage.getItem('mock_user') || 'null'),
    onAuthStateChanged: (callback: any) => {
      setTimeout(() => callback(mockAuth.currentUser), 10);
      return () => {};
    }
  };

  const mockDb = {
    _data: JSON.parse(localStorage.getItem('mock_db') || '{}'),
    _save: () => localStorage.setItem('mock_db', JSON.stringify(mockDb._data)),
    notify
  };

  return { mockAuth, mockDb, listeners };
};

const { mockAuth, mockDb, listeners } = createMockFirebase();

// --- REAL FIREBASE INITIALIZATION ---
let realAuth: any;
let realDb: any;
let app: any;

if (!isPlaceholder) {
  try {
    app = initializeApp(firebaseConfig);
    realAuth = FBAuth.getAuth(app);
    realDb = FBFirestore.getFirestore(app);
  } catch (e) {
    console.error("Firebase initialization failed:", e);
  }
}

// --- UNIVERSAL EXPORTS ---
export const auth = isPlaceholder ? mockAuth : realAuth;
export const db = isPlaceholder ? mockDb : realDb;
export const googleProvider = new FBAuth.GoogleAuthProvider();

// AUTH WRAPPERS
export const signInAnonymously = async (authInstance: any) => {
  if (isPlaceholder) {
    const user = { uid: 'guest_user', isAnonymous: true, email: 'guest@finwave.demo', displayName: 'Guest User' };
    mockAuth.currentUser = user;
    localStorage.setItem('mock_user', JSON.stringify(user));
    if (listeners['auth']) listeners['auth'].forEach(cb => cb(user));
    return { user };
  }
  return FBAuth.signInAnonymously(authInstance);
};

export const signOut = async (authInstance: any) => {
  if (isPlaceholder) {
    mockAuth.currentUser = null;
    localStorage.removeItem('mock_user');
    if (listeners['auth']) listeners['auth'].forEach(cb => cb(null));
    return;
  }
  return FBAuth.signOut(authInstance);
};

export const onAuthStateChanged = (authInstance: any, callback: any) => {
  if (isPlaceholder) {
    if (!listeners['auth']) listeners['auth'] = [];
    listeners['auth'].push(callback);
    callback(mockAuth.currentUser);
    return () => {
      listeners['auth'] = listeners['auth'].filter((cb: any) => cb !== callback);
    };
  }
  return FBAuth.onAuthStateChanged(authInstance, callback);
};

// FIRESTORE WRAPPERS
export const collection = (db: any, name: string) => isPlaceholder ? name : FBFirestore.collection(db, name);
export const doc = (db: any, name: string, id: string) => isPlaceholder ? `${name}/${id}` : FBFirestore.doc(db, name, id);

export const addDoc = async (col: any, data: any) => {
  if (isPlaceholder) {
    const id = Math.random().toString(36).substr(2, 9);
    if (!mockDb._data[col]) mockDb._data[col] = {};
    mockDb._data[col][id] = { ...data, id, timestamp: new Date().toISOString() };
    mockDb._save();
    mockDb.notify(col);
    return { id, ref: { id } };
  }
  return FBFirestore.addDoc(col, data);
};

export const setDoc = async (path: any, data: any) => {
  if (isPlaceholder) {
    const [col, id] = path.split('/');
    if (!mockDb._data[col]) mockDb._data[col] = {};
    mockDb._data[col][id] = { ...data, id };
    mockDb._save();
    mockDb.notify(col);
    return;
  }
  return FBFirestore.setDoc(path, data);
};

export const updateDoc = async (path: any, updates: any) => {
  if (isPlaceholder) {
    const [col, id] = path.split('/');
    if (mockDb._data[col] && mockDb._data[col][id]) {
      mockDb._data[col][id] = { ...mockDb._data[col][id], ...updates };
      mockDb._save();
      mockDb.notify(col);
    }
    return;
  }
  return FBFirestore.updateDoc(path, updates);
};

export const getDoc = async (path: any) => {
  if (isPlaceholder) {
    const [col, id] = path.split('/');
    const data = mockDb._data[col]?.[id];
    return { exists: () => !!data, data: () => data };
  }
  return FBFirestore.getDoc(path);
};

export const getDocs = async (q: any) => {
  if (isPlaceholder) {
    const colName = typeof q === 'string' ? q : q.col;
    const items = Object.values(mockDb._data[colName] || {});
    const filtered = (typeof q === 'object' && q.filter) 
      ? items.filter((i: any) => i[q.filter.field] === q.filter.value)
      : items;
    return {
      docs: filtered.map(d => ({
        id: (d as any).id,
        data: () => d,
        ref: { delete: () => deleteDoc(doc(null, colName, (d as any).id)) }
      }))
    };
  }
  return FBFirestore.getDocs(q);
};

export const deleteDoc = async (path: any) => {
  if (isPlaceholder) {
    const [col, id] = path.split('/');
    if (mockDb._data[col]) {
      delete mockDb._data[col][id];
      mockDb._save();
      mockDb.notify(col);
    }
    return;
  }
  return FBFirestore.deleteDoc(path);
};

export const onSnapshot = (q: any, callback: any) => {
  if (isPlaceholder) {
    const colName = typeof q === 'string' ? q : q.col;
    const filter = typeof q === 'object' ? q.filter : null;
    const run = () => {
      let items = Object.values(mockDb._data[colName] || {});
      if (filter) items = items.filter((i: any) => i[filter.field] === filter.value);
      callback({ docs: items.map(i => ({ id: (i as any).id, data: () => i })) });
    };
    if (!listeners[colName]) listeners[colName] = [];
    listeners[colName].push(run);
    run();
    return () => { listeners[colName] = listeners[colName].filter(l => l !== run); };
  }
  return FBFirestore.onSnapshot(q, callback);
};

export const query = (col: string, ...constraints: any[]) => {
  if (isPlaceholder) {
    const whereC = constraints.find(c => c.type === 'where');
    return { col, filter: whereC ? { field: whereC.field, value: whereC.value } : null };
  }
  return FBFirestore.query(col as any, ...constraints);
};

export const where = (field: string, op: string, value: any) => isPlaceholder ? { type: 'where', field, op, value } : FBFirestore.where(field, op as any, value);
export const orderBy = (field: string, dir: string) => isPlaceholder ? { type: 'orderBy', field, dir } : FBFirestore.orderBy(field, dir as any);
export const serverTimestamp = () => isPlaceholder ? new Date().toISOString() : FBFirestore.serverTimestamp();

// Legacy aliases for backward compatibility in the project
export const mockWhere = where;
export const mockOrderBy = orderBy;
export const mockServerTimestamp = serverTimestamp;
