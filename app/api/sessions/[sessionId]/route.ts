import { NextResponse } from "next/server";
import { getSession } from "@/lib/data/sessions";
import { getSeries } from "@/lib/data/series";

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
