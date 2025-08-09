

// Initialize Firebase
// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// Import Firestore from the full SDK, not firestore/lite.
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
const firebaseConfig = {
  apiKey: "AIzaSyCOWeB5tb-AOGRrffPRImEjnZjrqNHCzGY",
  authDomain: "borano-law-project-manager.firebaseapp.com",
  projectId: "borano-law-project-manager",
  storageBucket: "borano-law-project-manager.firebasestorage.app",
  messagingSenderId: "349650555810",
  appId: "1:349650555810:web:adeee19f8016fb38b018fb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); // Firestore instance (full SDK)
export const DB = getDatabase(app);    // Realtime Database (if needed)
export const storage = getStorage(app);    // Realtime Database (if needed)
export default app;