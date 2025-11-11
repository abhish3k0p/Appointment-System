// lib/auth.ts
import { useAuthStore } from "@/store/authStore";

export function getToken() {
  return useAuthStore.getState().token;
}
