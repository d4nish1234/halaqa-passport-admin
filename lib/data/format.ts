import type { Timestamp } from "firebase-admin/firestore";

export function formatDate(value: Timestamp | Date | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : value.toDate();
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function formatTime(value: Timestamp | Date | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : value.toDate();
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function formatDateTime(value: Timestamp | Date | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : value.toDate();
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
