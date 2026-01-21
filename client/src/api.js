import axios from "axios";

// Prefer explicit API base; fallback to backend base. In dev, allow empty baseURL for proxying.
const isDev = import.meta.env.DEV === true;
const configuredBase = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
const baseURL = configuredBase || (isDev ? '' : '');

const API = axios.create({
  baseURL,
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
