import { httpsCallable } from "firebase/functions";
import { functions, isFirebaseConfigured } from "../firebase/config";
function callable(name) {
    return async (payload) => {
        if (!isFirebaseConfigured || !functions) {
            throw new Error("Firebase Cloud Functions are not configured.");
        }
        const fn = httpsCallable(functions, name);
        const result = await fn(payload);
        return result.data;
    };
}
export const createTeamRegistration = callable("createTeamRegistration");
export const updateTeamMembers = callable("updateTeamMembers");
