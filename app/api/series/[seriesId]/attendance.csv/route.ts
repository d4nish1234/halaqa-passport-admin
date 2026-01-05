import { listAttendance } from "@/lib/data/attendance";
import { getSessionUser } from "@/lib/auth/session";
import { getSeries } from "@/lib/data/series";
import { isAdminEmail } from "@/lib/auth/admin";

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes("\n") || value.includes("\"")) {
    return `"${value.replace(/\"/g, '""')}"`;
  }
  return value;
}

export async function GET(
  _request: Request,
  { params }: { params: { seriesId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }
  const series = await getSeries(params.seriesId);
  if (!series) {
    return new Response("Not found", { status: 404 });
  }
  const isAdmin = isAdminEmail(user.email ?? "");
  if (!isAdmin && series.createdBy !== user.email) {
    return new Response("Forbidden", { status: 403 });
  }

  const attendance = await listAttendance(params.seriesId);
  const headers = ["participantId", "seriesId", "sessionId", "timestamp"];
  const lines = [headers.join(",")];

  for (const record of attendance) {
    const timestamp = record.timestamp?.toDate
      ? record.timestamp.toDate().toISOString()
      : "";
    const row = [
      record.participantId,
      record.seriesId,
      record.sessionId,
      timestamp
    ].map((value) => escapeCsv(String(value ?? "")));
    lines.push(row.join(","));
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=attendance-${params.seriesId}.csv`
    }
  });
}
