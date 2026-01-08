import Link from "next/link";
import { listSeriesForUser } from "@/lib/data/series";
import { listRecentSessions } from "@/lib/data/sessions";
import { formatDate, formatDateTime } from "@/lib/data/format";
import { getSessionUser } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";
import type { Timestamp } from "firebase-admin/firestore";

type SessionStatus = "OPEN" | "CLOSED" | "UPCOMING" | "UNKNOWN";

function getSessionStatus(
  checkinOpenAt: Timestamp | Date | null | undefined,
  checkinCloseAt: Timestamp | Date | null | undefined,
  now: number
): SessionStatus {
  if (!checkinOpenAt || !checkinCloseAt) return "UNKNOWN";
  const openAt = checkinOpenAt instanceof Date ? checkinOpenAt : checkinOpenAt.toDate();
  const closeAt =
    checkinCloseAt instanceof Date ? checkinCloseAt : checkinCloseAt.toDate();
  const openMs = openAt.getTime();
  const closeMs = closeAt.getTime();

  if (now < openMs) return "UPCOMING";
  if (now > closeMs) return "CLOSED";
  return "OPEN";
}

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
  const now = Date.now();

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
                        Sessions
                      </Link>
                      <Link
                        href={`/admin/series/${item.id}/attendance`}
                        className="action-menu-item"
                      >
                        Attendance
                      </Link>
                      <Link
                        href={`/admin/series/${item.id}/rewards`}
                        className="action-menu-item"
                      >
                        Rewards
                      </Link>
                      <Link
                        href={`/admin/series/${item.id}/permissions`}
                        className="action-menu-item"
                      >
                        Permissions
                      </Link>
                      <Link
                        href={`/admin/series/${item.id}/edit`}
                        className="action-menu-item"
                      >
                        Edit
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
            <div className="list-divided">
              {recentSessions.map((session) => {
                const status = getSessionStatus(
                  session.checkinOpenAt,
                  session.checkinCloseAt,
                  now
                );
                return (
                <div key={session.id} className="list-row">
                  <div>
                    <strong>{formatDateTime(session.startAt)}</strong>
                    <div style={{ color: "var(--muted)" }}>
                      Series: {seriesById.get(session.seriesId) ?? session.seriesId}
                    </div>
                    <div style={{ color: "var(--muted)" }}>Status: {status}</div>
                  </div>
                  {status !== "CLOSED" ? (
                    <Link
                      href={`/tv/${session.id}`}
                      className="button-link secondary"
                    >
                      Open TV mode
                    </Link>
                  ) : null}
                </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
