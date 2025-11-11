import axios from "axios";
import { getToken } from "./auth";

const api = axios.create({
  // baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api", //backend url
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://appointment-system-b5p7.onrender.com/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
