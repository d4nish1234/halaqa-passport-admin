import { getAdminFirestore } from "@/lib/firebase/admin";

type KidRecord = {
  nickname?: string;
};

const COLLECTION = "kids";

function chunk<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

export async function getKidsByIds(ids: string[]) {
  const db = getAdminFirestore();
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  const result = new Map<string, KidRecord>();

  for (const group of chunk(uniqueIds, 50)) {
    const refs = group.map((id) => db.collection(COLLECTION).doc(id));
    const snapshots = await db.getAll(...refs);
    for (const snap of snapshots) {
      if (snap.exists) {
        result.set(snap.id, snap.data() as KidRecord);
      }
    }
  }

  return result;
}
