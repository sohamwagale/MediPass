// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAN5bv_lD0cVQp4XjFVHvJPwVEmfLxC6WQ",
  authDomain: "chatbot-2e9be.firebaseapp.com",
  projectId: "chatbot-2e9be",
  storageBucket: "chatbot-2e9be.firebasestorage.app",
  messagingSenderId: "778129422681",
  appId: "1:778129422681:web:c80d6aa08f13f82cfbf448",
  databaseURL : 'https://chatbot-2e9be-default-rtdb.firebaseio.com/' 
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)
export const db = getFirestore(app)