import { collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, where, } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./config";
function requireDb() {
    if (!isFirebaseConfigured || !db) {
        throw new Error("Firebase is not configured.");
    }
    return db;
}
export function listenDoc(path, id, onData) {
    return onSnapshot(doc(requireDb(), path, id), (snap) => {
        onData(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
}
export function listenQuery(path, constraints, onData) {
    const q = query(collection(requireDb(), path), ...constraints);
    return onSnapshot(q, (snap) => {
        onData(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
    });
}
export async function getDocument(path, id) {
    const snap = await getDoc(doc(requireDb(), path, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
export async function listDocuments(path, ...constraints) {
    const snap = await getDocs(query(collection(requireDb(), path), ...constraints));
    return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}
export { collection, doc, getDoc, getDocs, orderBy, query, where };
