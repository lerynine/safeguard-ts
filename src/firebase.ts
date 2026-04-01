import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBQ3RE_2UzjYirguPXDFvYpzxu-li-TDQI",
  authDomain: "safeguard-aa3b1.firebaseapp.com",
  projectId: "safeguard-aa3b1",
  storageBucket: "safeguard-aa3b1.firebasestorage.app",
  messagingSenderId: "941322585049",
  appId: "1:941322585049:web:083e9ef9e8313b62bc8fc8",
  measurementId: "G-XQFFG1J046",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);