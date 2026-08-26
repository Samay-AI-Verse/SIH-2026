import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCtsPguhFXXUzDkdePfipkwl-FXAWKOGgM",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sih-2026-d3c4a.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sih-2026-d3c4a",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sih-2026-d3c4a.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "943519646042",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:943519646042:web:91a7ac11952cf681c0f363",
};
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.apiKey !== "demo");
let app = null;
let auth = null;
let db = null;
let functions = null;
if (isFirebaseConfigured) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    functions = getFunctions(app, import.meta.env.VITE_FUNCTIONS_REGION || "asia-south1");
    if (import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === "true") {
        connectFunctionsEmulator(functions, "localhost", 5001);
    }
}
export { app, auth, db, functions };
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: "select_account"
});
