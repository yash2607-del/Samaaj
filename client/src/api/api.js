import axios from "axios";

// Prefer explicit API base; fallback to backend base. In dev, allow empty baseURL for proxying.
const isDev = import.meta.env.DEV === true;
const configuredBase = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
const baseURL = configuredBase || (isDev ? 'http://localhost:3000' : '');

const clearStoredAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("userName");
  localStorage.removeItem("userId");
  window.dispatchEvent(new Event("authChanged"));
};

const normalizeToken = (raw) => {
  if (!raw) return "";
  const trimmed = String(raw).trim().replace(/^"|"$/g, "");
  return trimmed.replace(/^Bearer\s+/i, "");
};

const decodeJwtPayload = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const isUsableToken = (token) => {
  if (!token || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return false;
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  if (typeof payload.exp === 'number') {
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) return false;
  }
  return true;
};

const API = axios.create({
  baseURL,
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  const rawToken = localStorage.getItem("token");
  const token = normalizeToken(rawToken);

  if (token && isUsableToken(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (rawToken) {
    clearStoredAuth();
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const msg = String(error?.response?.data?.error || error?.response?.data?.message || "").toLowerCase();
    const url = String(error?.config?.url || '').toLowerCase();
    const isLoginRequest = url.includes('/login') || url.endsWith('login');

    if (!isLoginRequest && status === 401 && (msg.includes('token') || msg.includes('session') || msg.includes('unauthorized'))) {
      clearStoredAuth();
    }

    return Promise.reject(error);
  }
);

export default API;
