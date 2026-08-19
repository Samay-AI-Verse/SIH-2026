import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile, } from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "./config";
function requireAuthSdk() {
    if (!isFirebaseConfigured || !auth) {
        throw new Error("Firebase is not configured. Add your keys to the environment file.");
    }
    return auth;
}
export async function registerWithEmail(name, email, password) {
    const sdk = requireAuthSdk();
    const credential = await createUserWithEmailAndPassword(sdk, email, password);
    await updateProfile(credential.user, { displayName: name });
    return credential.user;
}
export async function loginWithEmail(email, password) {
    return signInWithEmailAndPassword(requireAuthSdk(), email, password);
}
export async function loginWithGoogle() {
    return signInWithPopup(requireAuthSdk(), googleProvider);
}
export async function logout() {
    return signOut(requireAuthSdk());
}
