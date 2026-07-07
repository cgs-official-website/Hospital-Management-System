import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC9d_wFrGOc6VQsP2aKC5CgLrykHeS1iog",
  authDomain: "clinical-management-syst-c698d.firebaseapp.com",
  databaseURL: "https://clinical-management-syst-c698d-default-rtdb.firebaseio.com",
  projectId: "clinical-management-syst-c698d",
  storageBucket: "clinical-management-syst-c698d.firebasestorage.app",
  messagingSenderId: "499377443630",
  appId: "1:499377443630:web:a5563be77ad1412a7d60bf",
  measurementId: "G-VT2DWZYTNR"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
