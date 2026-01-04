import { getAdminFirestore } from "@/lib/firebase/admin";
import type { Session, SessionRecord } from "@/lib/data/types";

const COLLECTION = "sessions";

export async function listSessions(seriesId: string): Promise<Session[]> {
  const db = getAdminFirestore();
  const snapshot = await db
    .collection(COLLECTION)
    .where("seriesId", "==", seriesId)
    .orderBy("startAt", "desc")
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as SessionRecord) }));
}

export async function listRecentSessions(limit = 5): Promise<Session[]> {
  const db = getAdminFirestore();
  const snapshot = await db
    .collection(COLLECTION)
    .orderBy("startAt", "desc")
    .limit(limit)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as SessionRecord) }));
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const db = getAdminFirestore();
  const doc = await db.collection(COLLECTION).doc(sessionId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as SessionRecord) };
}

export async function createSession(record: Omit<SessionRecord, "createdAt" | "token">) {
  const db = getAdminFirestore();
  const payload: SessionRecord = {
    ...record,
    token: null,
    createdAt: new Date() as any
  };
  const ref = await db.collection(COLLECTION).add(payload);
  return ref.id;
}

export async function updateSessionToken(sessionId: string, token: string) {
  const db = getAdminFirestore();
  await db.collection(COLLECTION).doc(sessionId).update({ token });
}
