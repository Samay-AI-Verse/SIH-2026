import { Cashfree, CFEnvironment } from "cashfree-pg";

const environment =
  process.env.CASHFREE_ENVIRONMENT === "PRODUCTION"
    ? CFEnvironment.PRODUCTION
    : CFEnvironment.SANDBOX;

export function getCashfree() {
  const clientId = process.env.CASHFREE_CLIENT_ID;
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Cashfree credentials are not configured on the server.");
  }

  return new Cashfree(environment, clientId, clientSecret);
}

export function publicCashfreeMode(): "sandbox" | "production" {
  return environment === CFEnvironment.PRODUCTION ? "production" : "sandbox";
}
