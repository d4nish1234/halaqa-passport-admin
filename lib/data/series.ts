import { getAdminFirestore } from "@/lib/firebase/admin";
import type { Series, SeriesRecord } from "@/lib/data/types";

const COLLECTION = "series";

export async function listSeries(): Promise<Series[]> {
  const db = getAdminFirestore();
  const snapshot = await db.collection(COLLECTION).orderBy("createdAt", "desc").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as SeriesRecord) }));
}

export async function getSeries(seriesId: string): Promise<Series | null> {
  const db = getAdminFirestore();
  const doc = await db.collection(COLLECTION).doc(seriesId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as SeriesRecord) };
}

export async function createSeries(record: Omit<SeriesRecord, "createdAt">) {
  const db = getAdminFirestore();
  const payload: SeriesRecord = {
    ...record,
    createdAt: new Date() as any
  };
  const ref = await db.collection(COLLECTION).add(payload);
  return ref.id;
}

export async function createNewSeries(
  record: Omit<SeriesRecord, "createdAt" | "completed">
) {
  return createSeries({ ...record, completed: false });
}

export async function updateSeriesStatus(
  seriesId: string,
  updates: { isActive: boolean; completed: boolean }
) {
  const db = getAdminFirestore();
  const payload = updates.completed
    ? { ...updates, isActive: false }
    : updates;
  await db.collection(COLLECTION).doc(seriesId).update(payload);
}
