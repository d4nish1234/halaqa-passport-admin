import Link from "next/link";
import { listSeriesForUser } from "@/lib/data/series";
import { listRecentSessions } from "@/lib/data/sessions";
import { formatDate, formatDateTime } from "@/lib/data/format";
import { getSessionUser } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";
import WelcomeModal from "@/components/WelcomeModal";
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
      <WelcomeModal />
      <div className="grid cols-2">
        <section className="card">
          <div className="card-header">
            <h2>Active series</h2>
            <Link href="/admin/series?new=1" className="button-link secondary">
              + Series
            </Link>
          </div>
          {activeSeries.length === 0 ? (
            <div className="empty-state">
              <p>No active series yet.</p>
              <Link href="/admin/series?new=1" className="button-link">
                Create your first series
              </Link>
            </div>
          ) : (
            <div className="list-divided">
              {activeSeries.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/series/${item.id}`}
                  className="list-row-link"
                >
                  <div>
                    <strong>{item.name}</strong>
                    <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>
                      {isAdmin ? `${item.createdBy} · ` : ""}
                      Started {formatDate(item.startDate)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
        <section className="card">
          <div className="card-header">
            <h2>Recent sessions</h2>
          </div>
          {recentSessions.length === 0 ? (
            <div className="empty-state">
              <p>No sessions yet.</p>
              <p style={{ color: "var(--muted)", fontSize: 13 }}>
                Create a session from any active series to get started.
              </p>
            </div>
          ) : (
            <div className="list-divided">
              {recentSessions.map((session) => {
                const status = getSessionStatus(
                  session.checkinOpenAt,
                  session.checkinCloseAt,
                  now
                );
                const badgeClass =
                  status === "CLOSED"
                    ? "badge closed"
                    : status === "UPCOMING"
                    ? "badge upcoming"
                    : "badge";
                return (
                <div key={session.id} className="list-row">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <strong>{formatDateTime(session.startAt)}</strong>
                      <span className={badgeClass}>{status}</span>
                    </div>
                    <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>
                      {seriesById.get(session.seriesId) ?? session.seriesId}
                    </div>
                  </div>
                  {status !== "CLOSED" ? (
                    <Link
                      href={`/tv/${session.id}`}
                      className="button-link secondary"
                    >
                      TV mode
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
