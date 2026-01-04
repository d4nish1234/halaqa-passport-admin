export function isEmailAllowed(email: string | null | undefined) {
  if (!email) return false;
  const rawList = process.env.ADMIN_EMAIL_ALLOWLIST ?? "";
  const allowlist = rawList
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (!allowlist.length) return false;
  return allowlist.includes(email.toLowerCase());
}
