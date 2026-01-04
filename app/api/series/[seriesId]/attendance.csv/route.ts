import { listAttendance } from "@/lib/data/attendance";
import { getSessionUser } from "@/lib/auth/session";

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

  const attendance = await listAttendance(params.seriesId);
  const headers = ["kidId", "seriesId", "sessionId", "timestamp"];
  const lines = [headers.join(",")];

  for (const record of attendance) {
    const timestamp = record.timestamp?.toDate
      ? record.timestamp.toDate().toISOString()
      : "";
    const row = [
      record.kidId,
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
