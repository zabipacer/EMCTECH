// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyD9t3DJ_NOF_DI27Grp8WqxRC8o0d40_Es",
  authDomain: "emctech-49954.firebaseapp.com",
  projectId: "emctech-49954",
  storageBucket: "emctech-49954.firebasestorage.app",
  messagingSenderId: "447091238779",
  appId: "1:447091238779:web:a09fb0f7c33a7250a2ffde",
  measurementId: "G-45V00CR96H"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const DB = getDatabase(app);
export const storage = getStorage(app);

// IMPORTANT: use force long polling in dev to avoid webchannel transport issues
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  merge: true
});

export default app;
