import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBIewTdCCy28N2i0u2zDDxi5Q7Ro6D_1vE",
  authDomain: "invest-track-pro-1b89b.firebaseapp.com",
  projectId: "invest-track-pro-1b89b",
  storageBucket: "invest-track-pro-1b89b.firebasestorage.app",
  messagingSenderId: "231325959266",
  appId: "1:231325959266:web:7d254ae795d6d45d75bd3b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
