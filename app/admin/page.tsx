import Link from "next/link";
import { listSeriesForUser } from "@/lib/data/series";
import { listRecentSessions } from "@/lib/data/sessions";
import { formatDate, formatDateTime } from "@/lib/data/format";
import { getSessionUser } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";

export default async function AdminDashboard() {
  const user = await getSessionUser();
  if (!user?.email) {
    return null;
  }
  const isAdmin = isAdminEmail(user.email);
  const [series, recentSessions] = await Promise.all([
    listSeriesForUser({ email: user.email, isAdmin }),
    listRecentSessions({ email: user.email, isAdmin, limit: 5 })
  ]);
  const activeSeries = series.filter((item) => item.isActive && !item.completed);
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
                <li
                  key={item.id}
                  style={{
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12
                  }}
                >
                  <div>
                    <strong>{item.name}</strong>
                    {isAdmin ? ` (${item.createdBy})` : ""} ·{" "}
                    {formatDate(item.startDate)}
                  </div>
                  <details className="action-menu">
                    <summary className="action-menu-trigger">...</summary>
                    <div className="action-menu-items">
                      <Link
                        href={`/admin/series/${item.id}/sessions`}
                        className="action-menu-item"
                      >
                        Manage sessions
                      </Link>
                      <Link
                        href={`/admin/series/${item.id}/attendance`}
                        className="action-menu-item"
                      >
                        Attendance
                      </Link>
                    </div>
                  </details>
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
