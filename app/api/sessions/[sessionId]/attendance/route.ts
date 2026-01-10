import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getSession } from "@/lib/data/sessions";
import { getSeries } from "@/lib/data/series";
import { isAdminEmail } from "@/lib/auth/admin";
import { canManageSeries } from "@/lib/auth/series";
import { listAttendanceForSession } from "@/lib/data/attendance";
import { getParticipantsByIds } from "@/lib/data/participants";

export async function GET(
  _request: Request,
  { params }: { params: { sessionId: string } }
) {
  const user = await getSessionUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const session = await getSession(params.sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }
  const series = await getSeries(session.seriesId);
  if (!series) {
    return NextResponse.json({ error: "Series not found." }, { status: 404 });
  }
  const isAdmin = isAdminEmail(user.email);
  if (!canManageSeries({ email: user.email, series, isAdmin })) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const attendance = await listAttendanceForSession(params.sessionId);
  const participantIds = attendance.map((record) => record.participantId);
  const participantsById = await getParticipantsByIds(participantIds);
  const attendees = attendance.map((record) => ({
    participantId: record.participantId,
    nickname: participantsById.get(record.participantId)?.nickname?.trim() ?? null,
    timestamp: record.timestamp?.toDate
      ? record.timestamp.toDate().toISOString()
      : null
  }));

  return NextResponse.json({ attendees });
}
