import Link from "next/link";
import { redirect } from "next/navigation";
import { getSeries } from "@/lib/data/series";
import { listSessions } from "@/lib/data/sessions";
import { listAttendance } from "@/lib/data/attendance";
import { getParticipantsByIds } from "@/lib/data/participants";
import { formatDateTime } from "@/lib/data/format";
import { getSessionUser } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";

export default async function AttendancePage({
  params
}: {
  params: { seriesId: string };
}) {
  const series = await getSeries(params.seriesId);
  if (!series) {
    redirect("/admin/series");
  }
  const user = await getSessionUser();
  if (!user?.email) {
    redirect("/login");
  }
  const isAdmin = isAdminEmail(user.email);
  if (!isAdmin && series.createdBy !== user.email) {
    redirect("/admin");
  }

  const [sessions, attendance] = await Promise.all([
    listSessions(params.seriesId),
    listAttendance(params.seriesId)
  ]);
  const participantIds = attendance.map((record) => record.participantId);
  const participantsById = await getParticipantsByIds(participantIds);

  const sessionCounts = new Map<string, number>();
  const participantCounts = new Map<string, number>();

  for (const record of attendance) {
    sessionCounts.set(
      record.sessionId,
      (sessionCounts.get(record.sessionId) ?? 0) + 1
    );
    participantCounts.set(
      record.participantId,
      (participantCounts.get(record.participantId) ?? 0) + 1
    );
  }

  const sortedParticipants = [...participantCounts.entries()].sort(
    (a, b) => b[1] - a[1]
  );
  const perfectAttendance = sortedParticipants.filter(
    ([, count]) => count === sessions.length && sessions.length > 0
  );
  const displayName = (participantId: string) => {
    const nickname = participantsById.get(participantId)?.nickname?.trim();
    const suffix = participantId.slice(-4);
    if (!nickname) return participantId;
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
        {sortedParticipants.length === 0 ? (
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
              {sortedParticipants.slice(0, 10).map(([participantId, count]) => (
                <tr key={participantId}>
                  <td>{displayName(participantId)}</td>
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
            {perfectAttendance.map(([participantId]) => (
              <li key={participantId}>{displayName(participantId)}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
