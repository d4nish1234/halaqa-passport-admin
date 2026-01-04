import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase/admin";
import { isEmailAllowed } from "@/lib/auth/allowlist";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

export async function createSessionCookie(idToken: string) {
  const auth = getAdminAuth();
  const decoded = await auth.verifyIdToken(idToken);

  if (!isEmailAllowed(decoded.email)) {
    throw new Error("Email is not allowed.");
  }

  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
  return auth.createSessionCookie(idToken, { expiresIn });
}

export async function verifySessionCookie(sessionCookie: string) {
  const auth = getAdminAuth();
  const decoded = await auth.verifySessionCookie(sessionCookie, true);

  if (!isEmailAllowed(decoded.email)) {
    throw new Error("Email is not allowed.");
  }

  return decoded;
}

export async function getSessionUser() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    return await verifySessionCookie(sessionCookie);
  } catch (error) {
    return null;
  }
}
