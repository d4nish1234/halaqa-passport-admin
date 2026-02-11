import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getSeries } from "@/lib/data/series";
import { isAdminEmail } from "@/lib/auth/admin";
import { canManageSeries } from "@/lib/auth/series";
import { updateParticipantNickname } from "@/lib/data/participants";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ seriesId: string; participantId: string }> }
) {
  const { seriesId, participantId } = await params;
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

  const payload = (await request.json().catch(() => ({}))) as {
    nickname?: string;
  };
  const nickname = String(payload.nickname ?? "").trim();
  if (!nickname) {
    return NextResponse.json({ error: "Nickname is required." }, { status: 400 });
  }

  await updateParticipantNickname(participantId, nickname);
  return NextResponse.json({ ok: true });
}
