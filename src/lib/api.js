const PRIMARY_URL = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim())
  ? import.meta.env.VITE_API_URL.trim()
  : "https://sih-2026-990895080781.asia-south1.run.app";

const FALLBACK_URLS = [
  "https://sih-2026-990895080781.asia-south1.run.app",
  "https://sih-2026-backend.onrender.com",
].filter((url, index, self) => url !== PRIMARY_URL && self.indexOf(url) === index);

export const API_BASE = PRIMARY_URL;
export const isApiConfigured = true;

const TOKEN_KEY = "sih_admin_token";
const AUTH_REVOCATION_KEY = "sih_auth_epoch_v2";

// Automatically invalidate and clear all legacy sessions across all devices
if (typeof window !== "undefined") {
  try {
    const currentEpoch = localStorage.getItem(AUTH_REVOCATION_KEY);
    if (currentEpoch !== "2026-08-26-v2") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.setItem(AUTH_REVOCATION_KEY, "2026-08-26-v2");
    }
  } catch (e) {
    // ignore localstorage error
  }
}

export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setAdminToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

export async function api(path, options = {}) {
  const headers = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };
  const token = getAdminToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const requestOptions = { ...options, headers };
  const targets = [PRIMARY_URL, ...FALLBACK_URLS];

  let lastError = null;

  for (let i = 0; i < targets.length; i++) {
    const targetBase = targets[i];
    const fullUrl = `${targetBase}${path}`;
    try {
      const isLongOp = path.includes("certificates") || path.includes("send-team") || path.includes("send-custom") || path.includes("generate");
      const response = await fetchWithTimeout(fullUrl, requestOptions, isLongOp ? 120000 : 25000);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401 && token) {
          setAdminToken("");
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("admin_unauthorized"));
          }
        }
        let errorMsg = "Request failed.";
        if (typeof data.detail === "string" && data.detail.trim()) {
          errorMsg = data.detail.trim();
        } else if (Array.isArray(data.detail) && data.detail.length > 0) {
          const first = data.detail[0];
          errorMsg = first?.msg || first?.message || "Validation error occurred.";
        } else if (data.error) {
          errorMsg = typeof data.error === "string" ? data.error : JSON.stringify(data.error);
        } else if (Array.isArray(data.details) && data.details.length > 0) {
          errorMsg = data.details[0]?.msg || "Validation error occurred.";
        }
        const err = new Error(errorMsg);
        err.isHttpError = true;
        err.status = response.status;
        throw err;
      }
      return data;
    } catch (err) {
      lastError = err;
      if (err.isHttpError) {
        throw err;
      }
      // If network error, loop will proceed to next target fallback URL
    }
  }

  const isNetworkFailure =
    lastError &&
    (lastError.name === "AbortError" ||
      lastError.message === "Failed to fetch" ||
      lastError.message === "Load failed" ||
      lastError.message === "NetworkError when attempting to fetch resource.");

  if (isNetworkFailure) {
    throw new Error("Unable to connect to registration server. Please check your internet connection and try again.");
  }

  throw lastError || new Error("Failed to communicate with the server.");
}


