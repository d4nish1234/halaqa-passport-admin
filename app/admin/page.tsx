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
            <p>No active series yet.</p>
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
                    {isAdmin ? ` (${item.createdBy})` : ""} ·{" "}
                    {formatDate(item.startDate)}
                  </div>
                </Link>
              ))}
            </div>
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
