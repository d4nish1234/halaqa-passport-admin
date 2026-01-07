import { NextResponse } from "next/server";
import { getSeries } from "@/lib/data/series";
import { listAttendance } from "@/lib/data/attendance";
import { getParticipantsByIds } from "@/lib/data/participants";

type LeaderboardEntry = {
  participantId: string;
  nickname: string | null;
  count: number;
};

export async function GET(
  _request: Request,
  { params }: { params: { seriesId: string } }
) {
  const series = await getSeries(params.seriesId);
  if (!series) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const attendance = await listAttendance(params.seriesId);
  const counts = new Map<string, number>();
  for (const record of attendance) {
    counts.set(record.participantId, (counts.get(record.participantId) ?? 0) + 1);
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const topEntries = sorted.slice(0, 10);
  const participantsById = await getParticipantsByIds(
    topEntries.map(([participantId]) => participantId)
  );

  const leaderboard: LeaderboardEntry[] = topEntries.map(
    ([participantId, count]) => ({
      participantId,
      nickname: participantsById.get(participantId)?.nickname?.trim() ?? null,
      count
    })
  );

  return NextResponse.json({ seriesName: series.name, leaderboard });
}
