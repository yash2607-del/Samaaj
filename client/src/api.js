import axios from "axios";

// Use relative base URL during local development so Vite proxy can forward requests.
const isDev = import.meta.env.DEV === true;
const configuredBackend = import.meta.env.VITE_BACKEND_URL || '';
const baseURL = isDev ? '' : configuredBackend;

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
