import { NextResponse } from "next/server";
import { getSession, deleteSessionWithAttendance } from "@/lib/data/sessions";
import { getSeries } from "@/lib/data/series";
import { getSessionUser } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";

function toIso(value: any) {
  if (!value) return null;
  const date = value.toDate ? value.toDate() : value;
  return date.toISOString();
}

export async function GET(
  _request: Request,
  { params }: { params: { sessionId: string } }
) {
  const session = await getSession(params.sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }
  const series = await getSeries(session.seriesId);

  return NextResponse.json({
    id: session.id,
    seriesId: session.seriesId,
    seriesName: series?.name ?? null,
    startAt: toIso(session.startAt),
    checkinOpenAt: toIso(session.checkinOpenAt),
    checkinCloseAt: toIso(session.checkinCloseAt),
    token: session.token
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { sessionId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const session = await getSession(params.sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }
  const isAdmin = isAdminEmail(user.email ?? "");
  if (!isAdmin && session.createdBy !== user.email) {
    const series = await getSeries(session.seriesId);
    if (!series || series.createdBy !== user.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  await deleteSessionWithAttendance(params.sessionId);
  return NextResponse.json({ ok: true });
}
