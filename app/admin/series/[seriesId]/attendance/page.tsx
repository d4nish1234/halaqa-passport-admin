import Link from "next/link";
import { redirect } from "next/navigation";
import { getSeries } from "@/lib/data/series";
import { listSessions } from "@/lib/data/sessions";
import { listAttendance } from "@/lib/data/attendance";
import { getKidsByIds } from "@/lib/data/kids";
import { formatDateTime } from "@/lib/data/format";

export default async function AttendancePage({
  params
}: {
  params: { seriesId: string };
}) {
  const series = await getSeries(params.seriesId);
  if (!series) {
    redirect("/admin/series");
  }

  const [sessions, attendance] = await Promise.all([
    listSessions(params.seriesId),
    listAttendance(params.seriesId)
  ]);
  const kidIds = attendance.map((record) => record.kidId);
  const kidsById = await getKidsByIds(kidIds);

  const sessionCounts = new Map<string, number>();
  const kidCounts = new Map<string, number>();

  for (const record of attendance) {
    sessionCounts.set(
      record.sessionId,
      (sessionCounts.get(record.sessionId) ?? 0) + 1
    );
    kidCounts.set(record.kidId, (kidCounts.get(record.kidId) ?? 0) + 1);
  }

  const sortedKids = [...kidCounts.entries()].sort((a, b) => b[1] - a[1]);
  const perfectAttendance = sortedKids.filter(
    ([, count]) => count === sessions.length && sessions.length > 0
  );
  const displayName = (kidId: string) => {
    const nickname = kidsById.get(kidId)?.nickname?.trim();
    const suffix = kidId.slice(-4);
    if (!nickname) return kidId;
    return `${nickname} (${suffix})`;
  };

  return (
    <div className="grid cols-2">
      <section className="card">
        <h2>Attendance for {series.name}</h2>
        <div style={{ marginBottom: 12 }}>
          <Link href={`/api/series/${params.seriesId}/attendance.csv`}>
            Export CSV
          </Link>
        </div>
        {sessions.length === 0 ? (
          <p>No sessions yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Session</th>
                <th>Attendance</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td>{formatDateTime(session.startAt)}</td>
                  <td>{sessionCounts.get(session.id) ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <section className="card">
        <h2>Top attendees</h2>
        {sortedKids.length === 0 ? (
          <p>No attendance records yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nickname</th>
                <th>Sessions attended</th>
              </tr>
            </thead>
            <tbody>
              {sortedKids.slice(0, 10).map(([kidId, count]) => (
                <tr key={kidId}>
                  <td>{displayName(kidId)}</td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <h3 style={{ marginTop: 24 }}>Perfect attendance</h3>
        {perfectAttendance.length === 0 ? (
          <p>No perfect attendance yet.</p>
        ) : (
          <ul>
            {perfectAttendance.map(([kidId]) => (
              <li key={kidId}>{displayName(kidId)}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
