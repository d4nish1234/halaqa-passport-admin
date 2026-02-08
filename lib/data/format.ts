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

export function parseLocalDateTime(value: string, timezoneOffset: number): Date | null {
  const normalized = value.trim();
  if (!normalized) return null;
  const absOffset = Math.abs(timezoneOffset);
  const sign = timezoneOffset > 0 ? "-" : "+";
  const hours = String(Math.floor(absOffset / 60)).padStart(2, "0");
  const minutes = String(absOffset % 60).padStart(2, "0");
  const iso = `${normalized}:00${sign}${hours}:${minutes}`;
  return new Date(iso);
}
