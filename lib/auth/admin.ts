export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAIL ?? "";
  const list = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (!list.length) return false;
  return list.includes(email.toLowerCase());
}
