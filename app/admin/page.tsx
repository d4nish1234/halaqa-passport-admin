import Link from "next/link";
import { listSeries } from "@/lib/data/series";
import { listRecentSessions } from "@/lib/data/sessions";
import { formatDate, formatDateTime } from "@/lib/data/format";

export default async function AdminDashboard() {
  const series = await listSeries();
  const recentSessions = await listRecentSessions(5);
  const activeSeries = series.filter((item) => item.isActive);
  const seriesById = new Map(series.map((item) => [item.id, item.name]));

  return (
    <>
      <div className="grid cols-2">
        <section className="card">
          <h2>Active series</h2>
          {activeSeries.length === 0 ? (
            <p>No active series yet.</p>
          ) : (
            <ul>
              {activeSeries.map((item) => (
                <li key={item.id} style={{ marginBottom: 8 }}>
                  <strong>{item.name}</strong> · {formatDate(item.startDate)}
                  {" - "}
                  {formatDate(item.endDate)}
                  <div style={{ marginTop: 6 }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Link href={`/admin/series/${item.id}/sessions`}>
                        <button type="button" className="secondary">
                          Manage sessions
                        </button>
                      </Link>
                      <Link href={`/admin/series/${item.id}/attendance`}>
                        <button type="button" className="secondary">
                          Attendance
                        </button>
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card">
          <h2>Recent sessions</h2>
          {recentSessions.length === 0 ? (
            <p>No sessions yet.</p>
          ) : (
            <ul>
              {recentSessions.map((session) => (
                <li key={session.id} style={{ marginBottom: 10 }}>
                  <div>
                    <strong>{formatDateTime(session.startAt)}</strong>
                  </div>
                  <div style={{ color: "var(--muted)" }}>
                    Series: {seriesById.get(session.seriesId) ?? session.seriesId}
                  </div>
                  <div>
                    <Link href={`/tv/${session.id}`}>Open TV mode</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <section className="card" style={{ marginTop: 24 }}>
        <h2>Quick actions</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/admin/series">
            <button>Create or manage series</button>
          </Link>
        </div>
      </section>
    </>
  );
}
