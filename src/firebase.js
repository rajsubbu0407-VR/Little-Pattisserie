import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD_IxI8lc3mt3sug8be3VcU-o07Q1h7uRw",
  authDomain: "little-patesserie.firebaseapp.com",
  projectId: "little-patesserie",
  storageBucket: "little-patesserie.firebasestorage.app",
  messagingSenderId: "45648803462",
  appId: "1:45648803462:web:4fce3e344f665b0e644307",
  measurementId: "G-7D55FWVZND"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;