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
