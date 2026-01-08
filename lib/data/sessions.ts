import { getAdminFirestore } from "@/lib/firebase/admin";
import type { Session, SessionRecord } from "@/lib/data/types";
import { listSeriesForUser } from "@/lib/data/series";
import { deleteAttendanceForSession } from "@/lib/data/attendance";

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

export async function listRecentSessions(params: {
  limit?: number;
  email: string;
  isAdmin: boolean;
}): Promise<Session[]> {
  const db = getAdminFirestore();
  const base = db.collection(COLLECTION).orderBy("startAt", "desc");
  if (params.isAdmin) {
    const snapshot = await base.limit(params.limit ?? 5).get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as SessionRecord)
    }));
  }

  const series = await listSeriesForUser({
    email: params.email,
    isAdmin: false
  });
  const seriesIds = series.map((item) => item.id);
  if (seriesIds.length === 0) return [];

  if (seriesIds.length <= 10) {
    const snapshot = await base
      .where("seriesId", "in", seriesIds)
      .limit(params.limit ?? 5)
      .get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as SessionRecord)
    }));
  }

  const ownedSnapshot = await base
    .where("createdBy", "==", params.email)
    .limit(params.limit ?? 5)
    .get();
  return ownedSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as SessionRecord)
  }));
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const db = getAdminFirestore();
  const doc = await db.collection(COLLECTION).doc(sessionId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as SessionRecord) };
}

export async function createSession(record: Omit<SessionRecord, "createdAt">) {
  const db = getAdminFirestore();
  const payload: SessionRecord = {
    ...record,
    token: record.token ?? null,
    createdAt: new Date() as any
  };
  const ref = await db.collection(COLLECTION).add(payload);
  return ref.id;
}

export async function updateSessionToken(sessionId: string, token: string) {
  const db = getAdminFirestore();
  await db.collection(COLLECTION).doc(sessionId).update({ token });
}

export async function deleteSessionWithAttendance(sessionId: string) {
  const db = getAdminFirestore();
  await deleteAttendanceForSession(sessionId);
  await db.collection(COLLECTION).doc(sessionId).delete();
}
