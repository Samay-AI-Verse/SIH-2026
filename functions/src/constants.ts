import { Timestamp } from "firebase-admin/firestore";
import problemsJson from "./problems.json";

export const ROLES = {
  TEAM_LEADER: "TEAM_LEADER",
  TEAM_MEMBER: "TEAM_MEMBER",
  ADMIN: "ADMIN",
} as const;

export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;

export const REGISTRATION_STATUS = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
} as const;

export const PROBLEM_STATUS = {
  AVAILABLE: "AVAILABLE",
  FULL: "FULL",
  LOCKED: "LOCKED",
  INACTIVE: "INACTIVE",
} as const;

export const SELECTION_STATUS = {
  SELECTED: "SELECTED",
  RESET: "RESET",
  REASSIGNED: "REASSIGNED",
  ADMIN_OVERRIDE: "ADMIN_OVERRIDE",
} as const;

export function now() {
  return Timestamp.now();
}

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export const SAMPLE_PROBLEMS = problemsJson as Array<{
  id: string;
  code?: string;
  title: string;
  organization: string;
  category: string;
  difficulty: string;
  description: string;
  background: string;
  expectedSolution: string;
  technicalRequirements: string[];
  technologies: string[];
  constraints: string[];
  evaluationCriteria: string[];
}>;
