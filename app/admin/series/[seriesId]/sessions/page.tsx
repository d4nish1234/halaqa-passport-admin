import Link from "next/link";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { getSeries } from "@/lib/data/series";
import { createSession, listSessions } from "@/lib/data/sessions";
import { formatDateTime, formatTime } from "@/lib/data/format";
import DeleteSessionButton from "@/components/DeleteSessionButton";
import { getSessionUser } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";
import { canManageSeries } from "@/lib/auth/series";
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

export default async function SessionsPage({
  params
}: {
  params: { seriesId: string };
}) {
  const series = await getSeries(params.seriesId);
  if (!series) {
    redirect("/admin/series");
  }

  async function createSessionAction(formData: FormData) {
    "use server";
    const user = await getSessionUser();
    if (!user?.email) return;
    const currentSeries = await getSeries(params.seriesId);
    const isAdmin = isAdminEmail(user.email);
    if (
      !currentSeries ||
      !canManageSeries({ email: user.email, series: currentSeries, isAdmin }) ||
      !currentSeries.isActive ||
      currentSeries.completed
    ) {
      return;
    }
    const startAt = String(formData.get("startAt") ?? "").trim();
    const checkinOpenAt = String(formData.get("checkinOpenAt") ?? "").trim();
    const checkinCloseAt = String(formData.get("checkinCloseAt") ?? "").trim();

    if (!startAt || !checkinOpenAt || !checkinCloseAt) {
      return;
    }

    const token = crypto.randomBytes(6).toString("hex");
    await createSession({
      seriesId: params.seriesId,
      startAt: new Date(startAt) as any,
      checkinOpenAt: new Date(checkinOpenAt) as any,
      checkinCloseAt: new Date(checkinCloseAt) as any,
      token,
      createdBy: user.email
    });

    redirect(`/admin/series/${params.seriesId}/sessions`);
  }

  const sessions = await listSessions(params.seriesId);
  const user = await getSessionUser();
  if (!user?.email) {
    redirect("/login");
  }
  const isAdmin = isAdminEmail(user.email);
  if (!canManageSeries({ email: user.email, series, isAdmin })) {
    redirect("/admin");
  }

  const now = Date.now();
  const sessionsWithStatus = sessions.map((session) => {
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
    return { session, status, badgeClass };
  });

  return (
    <div className="grid cols-2">
      <section className="card">
        <h2>Sessions for {series.name}</h2>
        {sessions.length === 0 ? (
          <p>No sessions yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Start</th>
                <th>Check-in</th>
                <th>Status</th>
                <th>Token</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sessionsWithStatus.map(({ session, status, badgeClass }) => (
                <tr key={session.id}>
                  <td>{formatDateTime(session.startAt)}</td>
                  <td>
                    {formatTime(session.checkinOpenAt)} - {formatTime(session.checkinCloseAt)}
                  </td>
                  <td>
                    <span className={badgeClass}>{status}</span>
                  </td>
                  <td>{session.token ?? "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Link
                        href={`/tv/${session.id}`}
                        className="button-link secondary"
                      >
                        TV mode
                      </Link>
                      <DeleteSessionButton sessionId={session.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <section className="card">
        <h2>Create session</h2>
        {!series.isActive || series.completed ? (
          <p style={{ color: "var(--muted)" }}>
            This series is inactive or completed. Reactivate it to create new
            sessions.
          </p>
        ) : null}
        <form action={createSessionAction}>
          <label>
            Session start
            <input
              type="datetime-local"
              name="startAt"
              required
              disabled={!series.isActive || series.completed}
            />
          </label>
          <label>
            Check-in opens
            <input
              type="datetime-local"
              name="checkinOpenAt"
              required
              disabled={!series.isActive || series.completed}
            />
          </label>
          <label>
            Check-in closes
            <input
              type="datetime-local"
              name="checkinCloseAt"
              required
              disabled={!series.isActive || series.completed}
            />
          </label>
          <button
            type="submit"
            disabled={!series.isActive || series.completed}
          >
            Create session
          </button>
        </form>
      </section>
    </div>
  );
}
