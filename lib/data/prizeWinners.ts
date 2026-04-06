import { getAdminFirestore } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import type { PrizeWinner, PrizeWinnerRecord } from "@/lib/data/types";

const COLLECTION = "prizeWinners";

export async function listPrizeWinnersForSeries(
  seriesId: string
): Promise<PrizeWinner[]> {
  const db = getAdminFirestore();
  const snapshot = await db
    .collection(COLLECTION)
    .where("seriesId", "==", seriesId)
    .get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as PrizeWinnerRecord)
  }));
}

export async function createPrizeWinner(
  record: Omit<PrizeWinnerRecord, "timestamp">
) {
  const db = getAdminFirestore();
  const payload: PrizeWinnerRecord = {
    ...record,
    timestamp: Timestamp.fromDate(new Date())
  };
  const ref = await db.collection(COLLECTION).add(payload);
  return ref.id;
}

export async function deletePrizeWinner(id: string): Promise<void> {
  const db = getAdminFirestore();
  await db.collection(COLLECTION).doc(id).delete();
}
