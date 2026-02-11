import { listAttendance } from "@/lib/data/attendance";
import { getSessionUser } from "@/lib/auth/session";
import { getSeries } from "@/lib/data/series";
import { isAdminEmail } from "@/lib/auth/admin";
import { listSessions } from "@/lib/data/sessions";
import { getParticipantsByIds } from "@/lib/data/participants";
import type { Timestamp } from "firebase-admin/firestore";
import { canManageSeries } from "@/lib/auth/series";

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes("\n") || value.includes("\"")) {
    return `"${value.replace(/\"/g, '""')}"`;
  }
  return value;
}

function formatLocalTimestamp(value: Timestamp | Date | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : value.toDate();
  const formatter = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Etc/GMT+5"
  });
  const parts = formatter.formatToParts(date);
  const bag = new Map(parts.map((part) => [part.type, part.value]));
  const weekday = bag.get("weekday") ?? "";
  const day = bag.get("day") ?? "";
  const month = bag.get("month") ?? "";
  const year = bag.get("year") ?? "";
  const hour = bag.get("hour") ?? "";
  const minute = bag.get("minute") ?? "";
  const second = bag.get("second") ?? "";
  return `${weekday}, ${day} ${month} ${year} ${hour}:${minute}:${second} EST`.trim();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ seriesId: string }> }
) {
  const { seriesId } = await params;
  const user = await getSessionUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }
  const series = await getSeries(seriesId);
  if (!series) {
    return new Response("Not found", { status: 404 });
  }
  const isAdmin = isAdminEmail(user.email ?? "");
  if (!canManageSeries({ email: user.email ?? "", series, isAdmin })) {
    return new Response("Forbidden", { status: 403 });
  }

  const [attendance, sessions] = await Promise.all([
    listAttendance(seriesId),
    listSessions(seriesId)
  ]);
  const participantsById = await getParticipantsByIds(
    attendance.map((record) => record.participantId)
  );
  const sessionsById = new Map(sessions.map((session) => [session.id, session]));
  const headers = [
    "participant",
    "series",
    "session start",
    "check-in open",
    "check-in close",
    "timestamp"
  ];
  const lines = [headers.join(",")];

  for (const record of attendance) {
    const nickname = participantsById.get(record.participantId)?.nickname?.trim();
    const suffix = record.participantId.slice(-4);
    const participantLabel = nickname
      ? `${nickname} (${suffix})`
      : record.participantId;
    const session = sessionsById.get(record.sessionId);
    const timestamp = formatLocalTimestamp(record.timestamp);
    const sessionStart = formatLocalTimestamp(session?.startAt);
    const checkinOpen = formatLocalTimestamp(session?.checkinOpenAt);
    const checkinClose = formatLocalTimestamp(session?.checkinCloseAt);
    const row = [
      participantLabel,
      series.name,
      sessionStart,
      checkinOpen,
      checkinClose,
      timestamp
    ].map((value) => escapeCsv(String(value ?? "")));
    lines.push(row.join(","));
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=attendance-${seriesId}.csv`
    }
  });
}
