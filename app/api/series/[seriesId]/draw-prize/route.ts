import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getSeries } from "@/lib/data/series";
import { isAdminEmail } from "@/lib/auth/admin";
import { canManageSeries } from "@/lib/auth/series";
import { listAttendanceForSession } from "@/lib/data/attendance";
import { getParticipantsByIds } from "@/lib/data/participants";
import {
  listPrizeWinnersForSeries,
  createPrizeWinner,
  deletePrizeWinner
} from "@/lib/data/prizeWinners";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ seriesId: string }> }
) {
  const { seriesId } = await params;
  const user = await getSessionUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const series = await getSeries(seriesId);
  if (!series) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const isAdmin = isAdminEmail(user.email);
  if (!canManageSeries({ email: user.email, series, isAdmin })) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    sessionId?: string;
    deletePrizeWinnerId?: string;
    excludeParticipantId?: string;
  };
  const sessionId = body.sessionId?.trim();
  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required." },
      { status: 400 }
    );
  }

  // Reroll: delete the previous unclaimed prize winner record before drawing
  if (body.deletePrizeWinnerId) {
    await deletePrizeWinner(body.deletePrizeWinnerId);
  }

  const attendance = await listAttendanceForSession(sessionId);
  if (attendance.length === 0) {
    return NextResponse.json(
      { error: "No participants in this session." },
      { status: 400 }
    );
  }

  let eligibleIds = [
    ...new Set(attendance.map((record) => record.participantId))
  ];

  if (series.prizeExcludePastWinners) {
    const pastWinners = await listPrizeWinnersForSeries(seriesId);
    const pastWinnerIds = new Set(
      pastWinners.map((winner) => winner.participantId)
    );
    eligibleIds = eligibleIds.filter((id) => !pastWinnerIds.has(id));
  }

  // Exclude the previous unclaimed winner from the immediate redraw
  if (body.excludeParticipantId) {
    eligibleIds = eligibleIds.filter((id) => id !== body.excludeParticipantId);
  }

  if (eligibleIds.length === 0) {
    return NextResponse.json(
      { error: "No eligible participants remaining." },
      { status: 400 }
    );
  }

  const winnerIndex = Math.floor(Math.random() * eligibleIds.length);
  const winnerId = eligibleIds[winnerIndex];

  const newRecordId = await createPrizeWinner({
    participantId: winnerId,
    seriesId,
    sessionId
  });

  const participantsById = await getParticipantsByIds([winnerId]);
  const participant = participantsById.get(winnerId);
  const suffix = winnerId.slice(-4);
  const nickname = participant?.nickname?.trim() ?? null;
  const displayName = nickname ? `${nickname} (${suffix})` : `Participant (${suffix})`;

  return NextResponse.json({
    winner: {
      participantId: winnerId,
      nickname,
      displayName,
      prizeWinnerId: newRecordId
    }
  });
}
