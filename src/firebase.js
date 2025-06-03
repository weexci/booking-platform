import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyC1l-VnhbLgI6P8x1-cNe-72NK0Z1uj1dA",
    authDomain: "lab4-booking.firebaseapp.com",
    projectId: "lab4-booking",
    storageBucket: "lab4-booking.firebasestorage.app",
    messagingSenderId: "833198639710",
    appId: "1:833198639710:web:219dd03eaa3b16b82c82cf"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
