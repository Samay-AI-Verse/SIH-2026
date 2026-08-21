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
      const response = await fetchWithTimeout(fullUrl, requestOptions, 15000);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorMsg = data.detail || data.error || (Array.isArray(data.details) ? data.details[0]?.msg : null) || "Request failed.";
        throw new Error(errorMsg);
      }
      return data;
    } catch (err) {
      lastError = err;
      const isNetworkError =
        !err.response &&
        (err.name === "AbortError" ||
          err.message === "Failed to fetch" ||
          err.message === "Load failed" ||
          err.message === "NetworkError when attempting to fetch resource.");

      if (!isNetworkError) {
        // Validation / HTTP status code error thrown explicitly
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

