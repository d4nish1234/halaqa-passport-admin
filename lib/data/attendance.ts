import { getAdminFirestore } from "@/lib/firebase/admin";
import type { Attendance, AttendanceRecord } from "@/lib/data/types";

const COLLECTION = "attendance";

export async function listAttendance(seriesId: string): Promise<Attendance[]> {
  const db = getAdminFirestore();
  const snapshot = await db
    .collection(COLLECTION)
    .where("seriesId", "==", seriesId)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as AttendanceRecord) }));
}

export async function deleteAttendanceForSession(sessionId: string) {
  const db = getAdminFirestore();
  const batchSize = 500;
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;

  while (true) {
    let query = db
      .collection(COLLECTION)
      .where("sessionId", "==", sessionId)
      .limit(batchSize);
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    if (snapshot.empty) break;

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    lastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;
    if (snapshot.docs.length < batchSize) break;
  }
}
