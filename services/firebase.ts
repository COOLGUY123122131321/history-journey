import { getApps, getApp, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCgMredZzr5zMT3-UGG046VS0_7jdPtOfg",
  authDomain: "history-f24d6.firebaseapp.com",
  projectId: "history-f24d6",
storageBucket: "history-f24d6.firebasestorage.app",
  messagingSenderId: "816847779315",
  appId: "1:816847779315:web:474b3b4cca64cab7cbce86",
};

// Initialize Firebase
// Check if an app is already initialized to prevent errors
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export const db = getFirestore(app);
export const storage = getStorage(app);
export { auth, provider };