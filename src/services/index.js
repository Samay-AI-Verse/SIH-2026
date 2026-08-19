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
export const registrationService = {
    createTeam: callable("createTeamRegistration"),
    updateMembers: callable("updateTeamMembers"),
};
export const paymentService = {
    createOrder: callable("createPaymentOrder"),
    verify: callable("verifyPayment"),
};
export const selectionService = {
    select: callable("selectProblem"),
};
export const contactService = {
    submit: callable("submitContact"),
};
export const adminService = {
    resetSelection: callable("adminResetSelection"),
    reassign: callable("adminReassignSelection"),
    setProblemState: callable("adminSetProblemState"),
    upsertProblem: callable("adminUpsertProblem"),
    deleteProblem: callable("adminDeleteProblem"),
    updateSettings: callable("adminUpdateSettings"),
    cancelRegistration: callable("adminCancelRegistration"),
    refundPayment: callable("adminRefundPayment"),
    seed: callable("seedDemoData"),
};
