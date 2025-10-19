// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; // For Realtime Database
import { getFirestore } from "firebase/firestore"; // For Firestore

// const firebaseConfig = {
//   apiKey: "AIzaSyDs4_FcOYZOtHcssfRpLur5j6R9EQJttTw",
//   authDomain: "scentify-54c2e.firebaseapp.com",
//   projectId: "scentify-54c2e", // ✅ cleaned
//   databaseURL: "https://scentify-54c2e-default-rtdb.europe-west1.firebasedatabase.app",
//   storageBucket: "scentify-54c2e.appspot.com", // ✅ fixed domain
//   messagingSenderId: "964174847844",
//   appId: "1:964174847844:web:0927e6e07d05324ba26471" // ✅ cleaned
// };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Realtime Database (if needed)
export const database = getDatabase(app);

// Export Firestore
export const firestore = getFirestore(app);
