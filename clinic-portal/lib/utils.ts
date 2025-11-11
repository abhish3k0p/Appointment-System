import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility to combine and merge Tailwind CSS class names
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAvatarUrl(avatarUrl?: string | null) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  if (avatarUrl) {
    if (avatarUrl.startsWith("http")) return avatarUrl;
    return `${base}${avatarUrl}`;
  }

  return `${base}/uploads/default-avatar.png`;
}
