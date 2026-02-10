import Link from "next/link";
import { listSeriesForUser } from "@/lib/data/series";
import { listRecentSessions } from "@/lib/data/sessions";
import { formatDate } from "@/lib/data/format";
import { getSessionUser } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";
import WelcomeModal from "@/components/WelcomeModal";
import ClientDateTime from "@/components/ClientDateTime";
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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
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
  const completedSeries = series.filter((item) => item.completed);
  const seriesById = new Map(series.map((item) => [item.id, item.name]));
  const now = Date.now();

  const firstName = user.email.split("@")[0];

  return (
    <>
      <WelcomeModal />

      <div className="dash-greeting">
        <h2>{getGreeting()}, {firstName}</h2>
        <p>Here&apos;s an overview of your programs.</p>
      </div>

      <div className="dash-stats">
        <div className="dash-stat">
          <span className="dash-stat-value">{activeSeries.length}</span>
          <span className="dash-stat-label">Active series</span>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-value">{completedSeries.length}</span>
          <span className="dash-stat-label">Completed</span>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-value">{recentSessions.length}</span>
          <span className="dash-stat-label">Recent sessions</span>
        </div>
      </div>

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
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="dash-series-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="18" height="18">
                        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                      </svg>
                    </div>
                    <div>
                      <strong>{item.name}</strong>
                      <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>
                        {isAdmin ? `${item.createdBy} · ` : ""}
                        Started {formatDate(item.startDate)}
                      </div>
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
                const startAt =
                  session.startAt?.toDate?.().toISOString() ??
                  new Date(session.startAt as any).toISOString();
                return (
                <div key={session.id} className="list-row">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <strong>
                        <ClientDateTime value={startAt} format="datetime" />
                      </strong>
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
