import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import * as functionsV1 from "firebase-functions/v1";
import { defineSecret, defineString } from "firebase-functions/params";
import { getCashfree, publicCashfreeMode } from "./cashfree";
import {
  PAYMENT_STATUS,
  PROBLEM_STATUS,
  REGISTRATION_STATUS,
  ROLES,
  SAMPLE_PROBLEMS,
  SELECTION_STATUS,
  now,
} from "./constants";

initializeApp();
const db = getFirestore();

const cashfreeClientId = defineSecret("CASHFREE_CLIENT_ID");
const cashfreeClientSecret = defineSecret("CASHFREE_CLIENT_SECRET");
const seedSecret = defineSecret("SEED_SECRET");
const appUrl = defineString("APP_URL", { default: "http://localhost:5173" });
const adminEmails = defineString("ADMIN_EMAILS", { default: "" });
const cashfreeEnv = defineString("CASHFREE_ENVIRONMENT", { default: "SANDBOX" });

const REGION = "asia-south1";

type MemberInput = {
  name: string;
  email: string;
  phone: string;
  college: string;
  course: string;
  branch: string;
  year: string;
  studentId: string;
  gender?: string;
};

function requireAuth(auth: { uid: string; token: { email?: string } } | undefined) {
  if (!auth?.uid) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }
  return auth;
}

async function getUser(uid: string) {
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) {
    throw new HttpsError("failed-precondition", "User profile was not found.");
  }
  return { id: snap.id, ...snap.data() } as {
    id: string;
    name?: string;
    email?: string;
    role: string;
    teamId?: string;
    phone?: string;
  };
}

async function requireAdmin(uid: string) {
  const user = await getUser(uid);
  if (user.role !== ROLES.ADMIN) {
    throw new HttpsError("permission-denied", "Admin access required.");
  }
  return user;
}

async function requireLeader(uid: string) {
  const user = await getUser(uid);
  if (user.role !== ROLES.ADMIN && user.role !== ROLES.TEAM_LEADER) {
    throw new HttpsError("permission-denied", "Only team leaders can perform this action.");
  }
  return user;
}

async function writeAudit(entry: Record<string, unknown>) {
  await db.collection("auditLogs").add({
    ...entry,
    createdAt: now(),
  });
}

function validateMembers(members: MemberInput[]) {
  if (!Array.isArray(members) || members.length < 1) {
    throw new HttpsError("invalid-argument", "Add at least one team member besides the leader, or include the leader as a member.");
  }
  if (members.length > 6) {
    throw new HttpsError("invalid-argument", "A team can have a maximum of 6 members.");
  }

  const emails = new Set<string>();
  const studentIds = new Set<string>();
  let hasFemale = false;

  for (const member of members) {
    const required: Array<keyof MemberInput> = [
      "name",
      "email",
      "phone",
      "college",
      "course",
      "branch",
      "year",
      "studentId",
    ];
    for (const key of required) {
      if (!String(member[key] || "").trim()) {
        throw new HttpsError("invalid-argument", `Member field "${key}" is required.`);
      }
    }
    if (!String(member.gender || "").trim()) {
      throw new HttpsError("invalid-argument", "Each member must have a gender on record.");
    }
    if (String(member.gender).toLowerCase() === "female") {
      hasFemale = true;
    }
    const email = member.email.trim().toLowerCase();
    const studentId = member.studentId.trim().toLowerCase();
    if (emails.has(email)) {
      throw new HttpsError("invalid-argument", "Duplicate member email is not allowed.");
    }
    if (studentIds.has(studentId)) {
      throw new HttpsError("invalid-argument", "Duplicate student ID is not allowed.");
    }
    emails.add(email);
    studentIds.add(studentId);
  }

  if (!hasFemale) {
    throw new HttpsError("invalid-argument", "At least one female member is required.");
  }
}

async function nextRegistrationId(transaction: FirebaseFirestore.Transaction) {
  const counterRef = db.collection("counters").doc("teams");
  const counterSnap = await transaction.get(counterRef);
  const lastNumber = counterSnap.exists ? Number(counterSnap.data()?.lastNumber || 0) : 0;
  const next = lastNumber + 1;
  transaction.set(counterRef, { lastNumber: next, updatedAt: now() }, { merge: true });
  return `SIH26-TEAM-${String(next).padStart(3, "0")}`;
}

async function getRegistrationSettings() {
  const snap = await db.collection("settings").doc("registration").get();
  if (!snap.exists) {
    return { fee: 300, currency: "INR", isActive: true, minMembers: 6, maxMembers: 6 };
  }
  const data = snap.data() || {};
  return {
    fee: Number(data.fee ?? 300),
    currency: String(data.currency || "INR"),
    isActive: data.isActive !== false,
    minMembers: Number(data.minMembers ?? 6),
    maxMembers: Number(data.maxMembers ?? 6),
  };
}

export const onAuthUserCreated = functionsV1.region(REGION).auth.user().onCreate(async (user) => {
    if (!user?.uid) return;

    const email = (user.email || "").toLowerCase();
    const admins = adminEmails.value().split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);

    const memberQuery = await db
      .collection("teams")
      .where("memberEmails", "array-contains", email)
      .limit(1)
      .get();

    const isInvitedMember = !memberQuery.empty;
    const invitedTeam = isInvitedMember ? memberQuery.docs[0] : null;

    await db.collection("users").doc(user.uid).set(
      {
        name: user.displayName || "",
        email,
        photoURL: user.photoURL || "",
        role: admins.includes(email)
          ? ROLES.ADMIN
          : isInvitedMember
            ? ROLES.TEAM_MEMBER
            : ROLES.TEAM_LEADER,
        teamId: invitedTeam?.id || null,
        createdAt: now(),
        updatedAt: now(),
      },
      { merge: true }
    );

    if (invitedTeam) {
      await invitedTeam.ref.update({
        memberUids: FieldValue.arrayUnion(user.uid),
        updatedAt: now(),
      });
    }
  }
);

export const createTeamRegistration = onCall(
  { region: REGION, cors: true },
  async (request) => {
    const auth = requireAuth(request.auth);
    const leader = await requireLeader(auth.uid);
    const settings = await getRegistrationSettings();

    if (!settings.isActive) {
      throw new HttpsError("failed-precondition", "Registration is currently closed.");
    }

    if (leader.teamId) {
      const existing = await db.collection("teams").doc(leader.teamId).get();
      if (existing.exists && existing.data()?.registrationStatus !== REGISTRATION_STATUS.CANCELLED) {
        return { teamId: existing.id, registrationId: existing.data()?.registrationId, reused: true };
      }
    }

    const payload = request.data as {
      teamName: string;
      college: string;
      university: string;
      city: string;
      state: string;
      leaderName: string;
      email: string;
      phone: string;
      members: MemberInput[];
    };

    const teamName = String(payload.teamName || "").trim();
    const college = String(payload.college || "").trim();
    const university = String(payload.university || "").trim();
    const city = String(payload.city || "").trim();
    const state = String(payload.state || "").trim();
    const leaderName = String(payload.leaderName || leader.name || "").trim();
    const email = String(payload.email || leader.email || "").trim().toLowerCase();
    const phone = String(payload.phone || "").trim();

    if (!teamName || !college || !university || !city || !state || !leaderName || !email || !phone) {
      throw new HttpsError("invalid-argument", "All team information fields are required.");
    }

    validateMembers(payload.members || []);
    if ((payload.members || []).length < settings.minMembers || (payload.members || []).length > settings.maxMembers) {
      throw new HttpsError(
        "invalid-argument",
        `Team size must be between ${settings.minMembers} and ${settings.maxMembers} members.`
      );
    }

    const memberEmails = payload.members.map((member) => member.email.trim().toLowerCase());
    const teamRef = db.collection("teams").doc();

    const registrationId = await db.runTransaction(async (transaction) => {
      const id = await nextRegistrationId(transaction);
      transaction.set(teamRef, {
        registrationId: id,
        teamName,
        college,
        university,
        city,
        state,
        leaderId: auth.uid,
        leaderName,
        email,
        phone,
        members: payload.members.map((member) => ({
          ...member,
          email: member.email.trim().toLowerCase(),
          studentId: member.studentId.trim(),
        })),
        memberEmails,
        memberUids: [auth.uid],
        registrationStatus: REGISTRATION_STATUS.PENDING_PAYMENT,
        paymentStatus: PAYMENT_STATUS.PENDING,
        selectedProblemId: null,
        selectedProblemTitle: null,
        registeredAt: now(),
        updatedAt: now(),
      });
      transaction.set(
        db.collection("users").doc(auth.uid),
        {
          name: leaderName,
          email,
          phone,
          role: ROLES.TEAM_LEADER,
          teamId: teamRef.id,
          updatedAt: now(),
        },
        { merge: true }
      );
      return id;
    });

    return { teamId: teamRef.id, registrationId, reused: false };
  }
);

export const updateTeamMembers = onCall(
  { region: REGION, cors: true },
  async (request) => {
    const auth = requireAuth(request.auth);
    const { teamId, members } = request.data as { teamId: string; members: MemberInput[] };
    if (!teamId) throw new HttpsError("invalid-argument", "teamId is required.");

    validateMembers(members);
    const teamRef = db.collection("teams").doc(teamId);
    const teamSnap = await teamRef.get();
    if (!teamSnap.exists) throw new HttpsError("not-found", "Team not found.");

    const team = teamSnap.data()!;
    if (team.leaderId !== auth.uid) {
      throw new HttpsError("permission-denied", "Only the team leader can update members.");
    }
    if (team.registrationStatus === REGISTRATION_STATUS.CANCELLED) {
      throw new HttpsError("failed-precondition", "This registration was cancelled.");
    }

    await teamRef.update({
      members,
      memberEmails: members.map((member) => member.email.trim().toLowerCase()),
      updatedAt: now(),
    });

    return { ok: true };
  }
);

export const createPaymentOrder = onCall(
  {
    region: REGION,
    cors: true,
    secrets: [cashfreeClientId, cashfreeClientSecret],
  },
  async (request) => {
    const auth = requireAuth(request.auth);
    const { teamId } = request.data as { teamId: string };
    if (!teamId) throw new HttpsError("invalid-argument", "teamId is required.");

    process.env.CASHFREE_CLIENT_ID = cashfreeClientId.value();
    process.env.CASHFREE_CLIENT_SECRET = cashfreeClientSecret.value();
    process.env.CASHFREE_ENVIRONMENT = cashfreeEnv.value();

    const settings = await getRegistrationSettings();
    if (!settings.isActive) {
      throw new HttpsError("failed-precondition", "Registration payments are currently closed.");
    }

    const teamRef = db.collection("teams").doc(teamId);
    const teamSnap = await teamRef.get();
    if (!teamSnap.exists) throw new HttpsError("not-found", "Team not found.");
    const team = teamSnap.data()!;

    if (team.leaderId !== auth.uid) {
      throw new HttpsError("permission-denied", "Only the team leader can pay.");
    }
    if (team.registrationStatus === REGISTRATION_STATUS.CANCELLED) {
      throw new HttpsError("failed-precondition", "This registration was cancelled.");
    }
    if (team.paymentStatus === PAYMENT_STATUS.SUCCESS && team.registrationStatus === REGISTRATION_STATUS.CONFIRMED) {
      throw new HttpsError("already-exists", "This team is already confirmed.");
    }

    const existingPending = await db
      .collection("payments")
      .where("teamId", "==", teamId)
      .where("status", "in", [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PROCESSING])
      .limit(1)
      .get();

    const cashfree = getCashfree();
    const orderId = existingPending.empty
      ? `SIH26-${team.registrationId}-${Date.now()}`
      : existingPending.docs[0].data().orderId;

    if (existingPending.empty) {
      const paymentRef = db.collection("payments").doc();
      await paymentRef.set({
        teamId,
        leaderId: auth.uid,
        registrationId: team.registrationId,
        teamName: team.teamName,
        orderId,
        transactionId: null,
        amount: settings.fee,
        currency: settings.currency,
        status: PAYMENT_STATUS.PENDING,
        createdAt: now(),
        updatedAt: now(),
      });
    }

    await teamRef.update({
      paymentStatus: PAYMENT_STATUS.PROCESSING,
      updatedAt: now(),
    });

    const origin = appUrl.value().replace(/\/$/, "");
    const response = await cashfree.PGCreateOrder({
      order_id: orderId,
      order_amount: settings.fee,
      order_currency: settings.currency,
      customer_details: {
        customer_id: auth.uid,
        customer_name: team.leaderName,
        customer_email: team.email,
        customer_phone: String(team.phone).replace(/\D/g, "").slice(-10) || "9999999999",
      },
      order_meta: {
        return_url: `${origin}/payment/verify?order_id={order_id}`,
        notify_url: `${origin.replace(/:\d+$/, "")}/api/cashfree-webhook`,
      },
      order_tags: {
        teamId,
        registrationId: team.registrationId,
      },
    });

    const sessionId = response.data?.payment_session_id;
    if (!sessionId) {
      throw new HttpsError("internal", "Cashfree did not return a payment session.");
    }

    const paymentQuery = await db.collection("payments").where("orderId", "==", orderId).limit(1).get();
    if (!paymentQuery.empty) {
      await paymentQuery.docs[0].ref.update({
        paymentSessionId: sessionId,
        status: PAYMENT_STATUS.PROCESSING,
        updatedAt: now(),
      });
    }

    return {
      orderId,
      paymentSessionId: sessionId,
      amount: settings.fee,
      currency: settings.currency,
      mode: publicCashfreeMode(),
    };
  }
);

async function markPaymentSuccess(orderId: string, transactionId?: string) {
  const paymentQuery = await db.collection("payments").where("orderId", "==", orderId).limit(1).get();
  if (paymentQuery.empty) {
    throw new HttpsError("not-found", "Payment record was not found.");
  }
  const paymentRef = paymentQuery.docs[0].ref;
  const payment = paymentQuery.docs[0].data();
  const teamRef = db.collection("teams").doc(payment.teamId);

  await db.runTransaction(async (transaction) => {
    const teamSnap = await transaction.get(teamRef);
    if (!teamSnap.exists) {
      throw new HttpsError("not-found", "Team not found for this payment.");
    }
    transaction.update(paymentRef, {
      status: PAYMENT_STATUS.SUCCESS,
      transactionId: transactionId || payment.transactionId || orderId,
      verifiedAt: now(),
      updatedAt: now(),
    });
    transaction.update(teamRef, {
      paymentStatus: PAYMENT_STATUS.SUCCESS,
      registrationStatus: REGISTRATION_STATUS.CONFIRMED,
      confirmedAt: now(),
      updatedAt: now(),
    });
  });

  return {
    teamId: payment.teamId,
    registrationId: payment.registrationId,
    amount: payment.amount,
    currency: payment.currency,
    paymentId: paymentQuery.docs[0].id,
    transactionId: transactionId || payment.transactionId || orderId,
  };
}

async function markPaymentFailed(orderId: string) {
  const paymentQuery = await db.collection("payments").where("orderId", "==", orderId).limit(1).get();
  if (paymentQuery.empty) return;
  const payment = paymentQuery.docs[0].data();
  if (payment.status === PAYMENT_STATUS.SUCCESS) return;

  await paymentQuery.docs[0].ref.update({
    status: PAYMENT_STATUS.FAILED,
    updatedAt: now(),
  });
  await db.collection("teams").doc(payment.teamId).update({
    paymentStatus: PAYMENT_STATUS.FAILED,
    registrationStatus: REGISTRATION_STATUS.PENDING_PAYMENT,
    updatedAt: now(),
  });
}

export const verifyPayment = onCall(
  {
    region: REGION,
    cors: true,
    secrets: [cashfreeClientId, cashfreeClientSecret],
  },
  async (request) => {
    requireAuth(request.auth);
    const { orderId } = request.data as { orderId: string };
    if (!orderId) throw new HttpsError("invalid-argument", "orderId is required.");

    process.env.CASHFREE_CLIENT_ID = cashfreeClientId.value();
    process.env.CASHFREE_CLIENT_SECRET = cashfreeClientSecret.value();
    process.env.CASHFREE_ENVIRONMENT = cashfreeEnv.value();

    const cashfree = getCashfree();
    const order = await cashfree.PGFetchOrder(orderId);
    const orderStatus = String(order.data?.order_status || "").toUpperCase();

    if (orderStatus === "PAID") {
      let transactionId = "";
      try {
        const payments = await cashfree.PGOrderFetchPayments(orderId);
        const successful = (payments.data || []).find((item: { payment_status?: string }) => item.payment_status === "SUCCESS");
        transactionId = (successful as { cf_payment_id?: string } | undefined)?.cf_payment_id || "";
      } catch {
        transactionId = "";
      }
      const result = await markPaymentSuccess(orderId, String(transactionId || ""));
      return { status: PAYMENT_STATUS.SUCCESS, ...result };
    }

    if (["EXPIRED", "TERMINATED"].includes(orderStatus)) {
      await markPaymentFailed(orderId);
      return { status: PAYMENT_STATUS.FAILED, orderStatus };
    }

    return { status: PAYMENT_STATUS.PROCESSING, orderStatus };
  }
);

export const cashfreeWebhook = onRequest(
  {
    region: REGION,
    cors: false,
    secrets: [cashfreeClientId, cashfreeClientSecret],
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }

    process.env.CASHFREE_CLIENT_ID = cashfreeClientId.value();
    process.env.CASHFREE_CLIENT_SECRET = cashfreeClientSecret.value();
    process.env.CASHFREE_ENVIRONMENT = cashfreeEnv.value();

    try {
      const cashfree = getCashfree();
      const rawBody = typeof req.rawBody === "string" ? req.rawBody : req.rawBody.toString("utf8");
      cashfree.PGVerifyWebhookSignature(
        String(req.headers["x-webhook-signature"] || ""),
        rawBody,
        String(req.headers["x-webhook-timestamp"] || "")
      );

      const payload = req.body as {
        type?: string;
        data?: {
          order?: { order_id?: string };
          payment?: { cf_payment_id?: string; payment_status?: string };
        };
      };
      const orderId = payload.data?.order?.order_id;
      const paymentStatus = payload.data?.payment?.payment_status;
      const transactionId = payload.data?.payment?.cf_payment_id;

      if (orderId && (payload.type === "PAYMENT_SUCCESS_WEBHOOK" || paymentStatus === "SUCCESS")) {
        await markPaymentSuccess(orderId, transactionId);
      } else if (orderId && (payload.type === "PAYMENT_FAILED_WEBHOOK" || paymentStatus === "FAILED")) {
        await markPaymentFailed(orderId);
      }

      res.status(200).json({ ok: true });
    } catch (error) {
      console.error("Webhook verification failed", error);
      res.status(400).json({ ok: false });
    }
  }
);

export const selectProblem = onCall(
  { region: REGION, cors: true },
  async (request) => {
    const auth = requireAuth(request.auth);
    const { problemId } = request.data as { problemId: string };
    if (!problemId) throw new HttpsError("invalid-argument", "problemId is required.");

    const user = await requireLeader(auth.uid);
    if (!user.teamId) {
      throw new HttpsError("failed-precondition", "Complete your registration and payment to select a problem statement.");
    }

    const result = await db.runTransaction(async (transaction) => {
      const teamRef = db.collection("teams").doc(user.teamId!);
      const problemRef = db.collection("problemStatements").doc(problemId);
      const teamSnap = await transaction.get(teamRef);
      const problemSnap = await transaction.get(problemRef);

      if (!teamSnap.exists) throw new HttpsError("not-found", "Team not found.");
      if (!problemSnap.exists) throw new HttpsError("not-found", "Problem statement not found.");

      const team = teamSnap.data()!;
      const problem = problemSnap.data()!;

      if (team.leaderId !== auth.uid) {
        throw new HttpsError("permission-denied", "Only the team leader can select a problem.");
      }
      if (team.registrationStatus !== REGISTRATION_STATUS.CONFIRMED || team.paymentStatus !== PAYMENT_STATUS.SUCCESS) {
        throw new HttpsError("failed-precondition", "Complete your registration and payment to select a problem statement.");
      }
      if (team.selectedProblemId) {
        throw new HttpsError("already-exists", "Your team has already selected a problem statement.");
      }
      if (problem.status === PROBLEM_STATUS.LOCKED || problem.status === PROBLEM_STATUS.INACTIVE) {
        throw new HttpsError("failed-precondition", "This problem statement is locked.");
      }

      const maxSelections = Number(problem.maxSelections ?? 2);
      const selectedCount = Number(problem.selectedCount ?? 0);
      if (selectedCount >= maxSelections || problem.status === PROBLEM_STATUS.FULL) {
        throw new HttpsError("resource-exhausted", "Problem statement is already full.");
      }

      const nextCount = selectedCount + 1;
      const nextStatus = nextCount >= maxSelections ? PROBLEM_STATUS.FULL : PROBLEM_STATUS.AVAILABLE;
      const selectionRef = db.collection("problemSelections").doc();

      transaction.set(selectionRef, {
        selectionId: selectionRef.id,
        teamId: teamRef.id,
        teamName: team.teamName,
        college: team.college,
        registrationId: team.registrationId,
        problemId,
        problemCode: problem.code || problemId,
        problemTitle: problem.title,
        selectedAt: now(),
        status: SELECTION_STATUS.SELECTED,
        actorId: auth.uid,
      });
      transaction.update(problemRef, {
        selectedCount: nextCount,
        status: nextStatus,
        updatedAt: now(),
      });
      transaction.update(teamRef, {
        selectedProblemId: problemId,
        selectedProblemTitle: problem.title,
        selectionId: selectionRef.id,
        selectedAt: now(),
        updatedAt: now(),
      });

      return {
        selectionId: selectionRef.id,
        selectedCount: nextCount,
        maxSelections,
        status: nextStatus,
        title: problem.title,
        problemId,
      };
    });

    return result;
  }
);

export const adminResetSelection = onCall(
  { region: REGION, cors: true },
  async (request) => {
    const auth = requireAuth(request.auth);
    await requireAdmin(auth.uid);
    const { teamId, reason } = request.data as { teamId: string; reason?: string };
    if (!teamId) throw new HttpsError("invalid-argument", "teamId is required.");

    await db.runTransaction(async (transaction) => {
      const teamRef = db.collection("teams").doc(teamId);
      const teamSnap = await transaction.get(teamRef);
      if (!teamSnap.exists) throw new HttpsError("not-found", "Team not found.");
      const team = teamSnap.data()!;
      const problemId = team.selectedProblemId as string | null;
      if (!problemId) throw new HttpsError("failed-precondition", "This team has no selection to reset.");

      const problemRef = db.collection("problemStatements").doc(problemId);
      const problemSnap = await transaction.get(problemRef);
      const problem = problemSnap.data() || {};
      const selectedCount = Math.max(0, Number(problem.selectedCount ?? 1) - 1);
      const maxSelections = Number(problem.maxSelections ?? 2);
      const nextStatus =
        problem.status === PROBLEM_STATUS.LOCKED
          ? PROBLEM_STATUS.LOCKED
          : selectedCount >= maxSelections
            ? PROBLEM_STATUS.FULL
            : PROBLEM_STATUS.AVAILABLE;

      if (team.selectionId) {
        transaction.update(db.collection("problemSelections").doc(team.selectionId), {
          status: SELECTION_STATUS.RESET,
          resetAt: now(),
          resetBy: auth.uid,
          reason: reason || "Admin reset",
        });
      }

      if (problemSnap.exists) {
        transaction.update(problemRef, {
          selectedCount,
          status: nextStatus,
          updatedAt: now(),
        });
      }
      transaction.update(teamRef, {
        selectedProblemId: null,
        selectedProblemTitle: null,
        selectionId: null,
        selectedAt: null,
        updatedAt: now(),
      });
    });

    await writeAudit({
      action: "RESET_SELECTION",
      actorId: auth.uid,
      teamId,
      reason: reason || "Admin reset",
    });

    return { ok: true };
  }
);

export const adminReassignSelection = onCall(
  { region: REGION, cors: true },
  async (request) => {
    const auth = requireAuth(request.auth);
    await requireAdmin(auth.uid);
    const { teamId, problemId, reason } = request.data as {
      teamId: string;
      problemId: string;
      reason?: string;
    };
    if (!teamId || !problemId) {
      throw new HttpsError("invalid-argument", "teamId and problemId are required.");
    }

    await db.runTransaction(async (transaction) => {
      const teamRef = db.collection("teams").doc(teamId);
      const nextProblemRef = db.collection("problemStatements").doc(problemId);
      const teamSnap = await transaction.get(teamRef);
      const nextProblemSnap = await transaction.get(nextProblemRef);
      if (!teamSnap.exists) throw new HttpsError("not-found", "Team not found.");
      if (!nextProblemSnap.exists) throw new HttpsError("not-found", "Problem not found.");

      const team = teamSnap.data()!;
      const previousProblemId = team.selectedProblemId as string | null;
      if (previousProblemId) {
        const prevRef = db.collection("problemStatements").doc(previousProblemId);
        const prevSnap = await transaction.get(prevRef);
        if (prevSnap.exists) {
          const prev = prevSnap.data()!;
          const selectedCount = Math.max(0, Number(prev.selectedCount ?? 1) - 1);
          const maxSelections = Number(prev.maxSelections ?? 2);
          transaction.update(prevRef, {
            selectedCount,
            status:
              prev.status === PROBLEM_STATUS.LOCKED
                ? PROBLEM_STATUS.LOCKED
                : selectedCount >= maxSelections
                  ? PROBLEM_STATUS.FULL
                  : PROBLEM_STATUS.AVAILABLE,
            updatedAt: now(),
          });
        }
      }

      const nextProblem = nextProblemSnap.data()!;
      const maxSelections = Number(nextProblem.maxSelections ?? 2);
      const selectedCount = Number(nextProblem.selectedCount ?? 0);
      if (selectedCount >= maxSelections && nextProblem.status === PROBLEM_STATUS.FULL) {
        throw new HttpsError("resource-exhausted", "Target problem is already full.");
      }
      const nextCount = selectedCount + 1;
      transaction.update(nextProblemRef, {
        selectedCount: nextCount,
        status: nextCount >= maxSelections ? PROBLEM_STATUS.FULL : nextProblem.status,
        updatedAt: now(),
      });
      transaction.update(teamRef, {
        selectedProblemId: problemId,
        selectedProblemTitle: nextProblem.title,
        selectedAt: now(),
        updatedAt: now(),
      });
      const selectionRef = db.collection("problemSelections").doc();
      transaction.set(selectionRef, {
        selectionId: selectionRef.id,
        teamId,
        teamName: team.teamName,
        college: team.college,
        registrationId: team.registrationId,
        problemId,
        problemTitle: nextProblem.title,
        selectedAt: now(),
        status: SELECTION_STATUS.REASSIGNED,
        actorId: auth.uid,
        reason: reason || "Admin reassignment",
      });
    });

    await writeAudit({
      action: "REASSIGN_SELECTION",
      actorId: auth.uid,
      teamId,
      problemId,
      reason: reason || "Admin reassignment",
    });
    return { ok: true };
  }
);

export const adminSetProblemState = onCall(
  { region: REGION, cors: true },
  async (request) => {
    const auth = requireAuth(request.auth);
    await requireAdmin(auth.uid);
    const { problemId, status, reason } = request.data as {
      problemId: string;
      status: string;
      reason?: string;
    };
    const allowed = Object.values(PROBLEM_STATUS);
    if (!problemId || !allowed.includes(status as (typeof allowed)[number])) {
      throw new HttpsError("invalid-argument", "Valid problemId and status are required.");
    }
    await db.collection("problemStatements").doc(problemId).update({
      status,
      updatedAt: now(),
    });
    await writeAudit({
      action: "SET_PROBLEM_STATE",
      actorId: auth.uid,
      problemId,
      status,
      reason: reason || "",
    });
    return { ok: true };
  }
);

export const adminUpsertProblem = onCall(
  { region: REGION, cors: true },
  async (request) => {
    const auth = requireAuth(request.auth);
    await requireAdmin(auth.uid);
    const problem = request.data as Record<string, unknown>;
    const id = String(problem.id || problem.code || "").trim();
    if (!id || !problem.title) {
      throw new HttpsError("invalid-argument", "Problem id and title are required.");
    }
    const ref = db.collection("problemStatements").doc(id);
    const existing = await ref.get();
    await ref.set(
      {
        code: id,
        title: problem.title,
        organization: problem.organization || "",
        category: problem.category || "General",
        difficulty: problem.difficulty || "Medium",
        description: problem.description || "",
        background: problem.background || "",
        expectedSolution: problem.expectedSolution || "",
        technicalRequirements: problem.technicalRequirements || [],
        technologies: problem.technologies || [],
        constraints: problem.constraints || [],
        evaluationCriteria: problem.evaluationCriteria || [],
        maxSelections: Number(problem.maxSelections ?? 2),
        selectedCount: existing.exists ? existing.data()?.selectedCount ?? 0 : 0,
        status: problem.status || existing.data()?.status || PROBLEM_STATUS.AVAILABLE,
        updatedAt: now(),
        createdAt: existing.exists ? existing.data()?.createdAt : now(),
      },
      { merge: true }
    );
    await writeAudit({ action: "UPSERT_PROBLEM", actorId: auth.uid, problemId: id });
    return { ok: true, id };
  }
);

export const adminDeleteProblem = onCall(
  { region: REGION, cors: true },
  async (request) => {
    const auth = requireAuth(request.auth);
    await requireAdmin(auth.uid);
    const { problemId } = request.data as { problemId: string };
    const snap = await db.collection("problemStatements").doc(problemId).get();
    if (!snap.exists) throw new HttpsError("not-found", "Problem not found.");
    if (Number(snap.data()?.selectedCount || 0) > 0) {
      throw new HttpsError("failed-precondition", "Reset selections before deleting this problem.");
    }
    await snap.ref.delete();
    await writeAudit({ action: "DELETE_PROBLEM", actorId: auth.uid, problemId });
    return { ok: true };
  }
);

export const adminUpdateSettings = onCall(
  { region: REGION, cors: true },
  async (request) => {
    const auth = requireAuth(request.auth);
    await requireAdmin(auth.uid);
    const data = request.data as Record<string, unknown>;
    await db.collection("settings").doc("registration").set(
      {
        fee: Number(data.fee ?? 499),
        currency: String(data.currency || "INR"),
        isActive: data.isActive !== false,
        minMembers: Number(data.minMembers ?? 2),
        maxMembers: Number(data.maxMembers ?? 6),
        deadline: data.deadline || null,
        updatedAt: now(),
        updatedBy: auth.uid,
      },
      { merge: true }
    );
    await writeAudit({ action: "UPDATE_SETTINGS", actorId: auth.uid, data });
    return { ok: true };
  }
);

export const adminCancelRegistration = onCall(
  { region: REGION, cors: true },
  async (request) => {
    const auth = requireAuth(request.auth);
    await requireAdmin(auth.uid);
    const { teamId, reason } = request.data as { teamId: string; reason?: string };
    await db.collection("teams").doc(teamId).update({
      registrationStatus: REGISTRATION_STATUS.CANCELLED,
      updatedAt: now(),
    });
    await writeAudit({
      action: "CANCEL_REGISTRATION",
      actorId: auth.uid,
      teamId,
      reason: reason || "",
    });
    return { ok: true };
  }
);

export const adminRefundPayment = onCall(
  {
    region: REGION,
    cors: true,
    secrets: [cashfreeClientId, cashfreeClientSecret],
  },
  async (request) => {
    const auth = requireAuth(request.auth);
    await requireAdmin(auth.uid);
    const { paymentId, reason } = request.data as { paymentId: string; reason?: string };
    const paymentSnap = await db.collection("payments").doc(paymentId).get();
    if (!paymentSnap.exists) throw new HttpsError("not-found", "Payment not found.");
    const payment = paymentSnap.data()!;
    if (payment.status !== PAYMENT_STATUS.SUCCESS) {
      throw new HttpsError("failed-precondition", "Only successful payments can be refunded.");
    }

    process.env.CASHFREE_CLIENT_ID = cashfreeClientId.value();
    process.env.CASHFREE_CLIENT_SECRET = cashfreeClientSecret.value();
    process.env.CASHFREE_ENVIRONMENT = cashfreeEnv.value();

    const cashfree = getCashfree();
    await cashfree.PGOrderCreateRefund(payment.orderId, {
      refund_amount: payment.amount,
      refund_id: `refund-${paymentId}`,
      refund_note: reason || "Admin refund",
    });

    await paymentSnap.ref.update({
      status: PAYMENT_STATUS.REFUNDED,
      refundedAt: now(),
      updatedAt: now(),
    });
    await db.collection("teams").doc(payment.teamId).update({
      paymentStatus: PAYMENT_STATUS.REFUNDED,
      registrationStatus: REGISTRATION_STATUS.CANCELLED,
      updatedAt: now(),
    });
    await writeAudit({
      action: "REFUND_PAYMENT",
      actorId: auth.uid,
      paymentId,
      reason: reason || "",
    });
    return { ok: true };
  }
);

export const submitContact = onCall(
  { region: REGION, cors: true },
  async (request) => {
    const { name, email, subject, message } = request.data as {
      name: string;
      email: string;
      subject: string;
      message: string;
    };
    if (!name || !email || !subject || !message) {
      throw new HttpsError("invalid-argument", "All contact fields are required.");
    }
    await db.collection("contacts").add({
      name,
      email,
      subject,
      message,
      createdAt: now(),
      status: "NEW",
    });
    return { ok: true };
  }
);

export const seedDemoData = onCall(
  { region: REGION, cors: true, secrets: [seedSecret] },
  async (request) => {
    const provided = String(request.data?.secret || "");
    const isAdminCaller = request.auth?.uid ? (await getUser(request.auth.uid)).role === ROLES.ADMIN : false;
    if (!isAdminCaller && provided !== seedSecret.value()) {
      throw new HttpsError("permission-denied", "Seed secret or admin access required.");
    }

    const batch = db.batch();
    batch.set(
      db.collection("settings").doc("registration"),
      {
        fee: 300,
        currency: "INR",
        isActive: true,
        minMembers: 6,
        maxMembers: 6,
        deadline: Timestamp.fromDate(new Date("2026-09-03T18:30:00.000Z")),
        updatedAt: now(),
      },
      { merge: true }
    );

    for (const problem of SAMPLE_PROBLEMS) {
      const ref = db.collection("problemStatements").doc(problem.id);
      batch.set(
        ref,
        {
          code: problem.code || problem.id,
          title: problem.title,
          organization: problem.organization,
          category: problem.category,
          difficulty: problem.difficulty,
          description: problem.description,
          background: problem.background,
          expectedSolution: problem.expectedSolution,
          technicalRequirements: problem.technicalRequirements,
          technologies: problem.technologies,
          constraints: problem.constraints,
          evaluationCriteria: problem.evaluationCriteria,
          selectedCount: 0,
          maxSelections: 2,
          status: PROBLEM_STATUS.AVAILABLE,
          createdAt: now(),
          updatedAt: now(),
        },
        { merge: true }
      );
    }

    batch.set(db.collection("counters").doc("teams"), { lastNumber: 0, updatedAt: now() }, { merge: true });
    await batch.commit();
    return { ok: true, problems: SAMPLE_PROBLEMS.length };
  }
);
