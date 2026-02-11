import { NextResponse } from "next/server";
import { getSession, deleteSessionWithAttendance } from "@/lib/data/sessions";
import { getSeries } from "@/lib/data/series";
import { getSessionUser } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";
import { canManageSeries } from "@/lib/auth/series";

function toIso(value: any) {
  if (!value) return null;
  const date = value.toDate ? value.toDate() : value;
  return date.toISOString();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }
  const series = await getSeries(session.seriesId);

  const closeAt = session.checkinCloseAt?.toDate?.()
    ?? (session.checkinCloseAt ? new Date(session.checkinCloseAt as any) : null);
  const isClosed = closeAt ? Date.now() > closeAt.getTime() : false;

  return NextResponse.json({
    id: session.id,
    seriesId: session.seriesId,
    seriesName: series?.name ?? null,
    startAt: toIso(session.startAt),
    checkinOpenAt: toIso(session.checkinOpenAt),
    checkinCloseAt: toIso(session.checkinCloseAt),
    token: isClosed ? null : session.token,
    serverTime: new Date().toISOString()
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }
  const isAdmin = isAdminEmail(user.email ?? "");
  const series = await getSeries(session.seriesId);
  if (!series) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }
  if (!canManageSeries({ email: user.email ?? "", series, isAdmin })) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteSessionWithAttendance(sessionId);
  return NextResponse.json({ ok: true });
}
