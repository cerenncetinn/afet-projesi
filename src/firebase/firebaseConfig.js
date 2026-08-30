import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBfr9swnCG6NPXmlDBOy44U70bk-oycIs0",
  authDomain: "afetyonetimsistemi-b8a88.firebaseapp.com",
  projectId: "afetyonetimsistemi-b8a88",
  storageBucket: "afetyonetimsistemi-b8a88.firebasestorage.app",
  messagingSenderId: "263355753775",
  appId: "1:263355753775:web:fc5028d81d812c76242dda",
  //measurementId: "G-SERHYH8BRM",
};

const app = initializeApp(firebaseConfig);

let auth;

try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch (error) {
  auth = getAuth(app);
}

const db = getFirestore(app);

export { auth, db };

