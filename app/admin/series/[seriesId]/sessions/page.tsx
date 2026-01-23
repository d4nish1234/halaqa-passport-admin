import Link from "next/link";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { getSeries } from "@/lib/data/series";
import { createSession, listSessions } from "@/lib/data/sessions";
import { formatDateTime } from "@/lib/data/format";
import DeleteSessionButton from "@/components/DeleteSessionButton";
import { getSessionUser } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";
import { canManageSeries } from "@/lib/auth/series";
import CreateSessionModal from "@/components/CreateSessionModal";
import ClientDateTime from "@/components/ClientDateTime";
import { listAttendance } from "@/lib/data/attendance";
import SessionAttendanceModal from "@/components/SessionAttendanceModal";
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

function parseLocalDateTime(value: string, timezoneOffset: number) {
  const normalized = value.trim();
  if (!normalized) return null;
  const absOffset = Math.abs(timezoneOffset);
  const sign = timezoneOffset > 0 ? "-" : "+";
  const hours = String(Math.floor(absOffset / 60)).padStart(2, "0");
  const minutes = String(absOffset % 60).padStart(2, "0");
  const iso = `${normalized}:00${sign}${hours}:${minutes}`;
  return new Date(iso);
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
    const startAtInput = String(formData.get("startAt") ?? "").trim();
    const checkinOpenAtInput = String(formData.get("checkinOpenAt") ?? "").trim();
    const checkinCloseAtInput = String(formData.get("checkinCloseAt") ?? "").trim();
    const timezoneOffset = Number(formData.get("timezoneOffset") ?? 0);

    if (!checkinOpenAtInput || !checkinCloseAtInput) {
      return;
    }

    const effectiveStartAtInput = startAtInput || checkinOpenAtInput;
    const startAt = parseLocalDateTime(effectiveStartAtInput, timezoneOffset);
    const checkinOpenAt = parseLocalDateTime(checkinOpenAtInput, timezoneOffset);
    const checkinCloseAt = parseLocalDateTime(checkinCloseAtInput, timezoneOffset);
    if (!startAt || !checkinOpenAt || !checkinCloseAt) return;

    const token = crypto.randomBytes(6).toString("hex");
    await createSession({
      seriesId: params.seriesId,
      startAt: startAt as any,
      checkinOpenAt: checkinOpenAt as any,
      checkinCloseAt: checkinCloseAt as any,
      token,
      createdBy: user.email
    });

    redirect(`/admin/series/${params.seriesId}/sessions`);
  }

  const [sessions, attendance] = await Promise.all([
    listSessions(params.seriesId),
    listAttendance(params.seriesId)
  ]);
  const user = await getSessionUser();
  if (!user?.email) {
    redirect("/login");
  }
  const isAdmin = isAdminEmail(user.email);
  if (!canManageSeries({ email: user.email, series, isAdmin })) {
    redirect("/admin");
  }

  const now = Date.now();
  const sessionCounts = new Map<string, number>();
  for (const record of attendance) {
    sessionCounts.set(
      record.sessionId,
      (sessionCounts.get(record.sessionId) ?? 0) + 1
    );
  }

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
    const startAt =
      session.startAt?.toDate?.().toISOString() ??
      new Date(session.startAt as any).toISOString();
    const checkinOpenAt =
      session.checkinOpenAt?.toDate?.().toISOString() ??
      new Date(session.checkinOpenAt as any).toISOString();
    const checkinCloseAt =
      session.checkinCloseAt?.toDate?.().toISOString() ??
      new Date(session.checkinCloseAt as any).toISOString();
    const attendanceCount = sessionCounts.get(session.id) ?? 0;
    return {
      session,
      status,
      badgeClass,
      startAt,
      checkinOpenAt,
      checkinCloseAt,
      attendanceCount
    };
  });

  return (
    <section className="card">
      <div className="card-header">
        <h2>Sessions for {series.name}</h2>
        <CreateSessionModal
          action={createSessionAction}
          disabled={!series.isActive || series.completed}
          seriesId={series.id}
        />
      </div>
      {!series.isActive || series.completed ? (
        <p style={{ color: "var(--muted)" }}>
          This series is inactive or completed. Reactivate it to create new
          sessions.
        </p>
      ) : null}
      {sessions.length === 0 ? (
        <p>No sessions yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Start</th>
              <th>Check-in</th>
              <th>Status</th>
              <th>Attendance</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sessionsWithStatus.map(
              ({
                session,
                status,
                badgeClass,
                startAt,
                checkinOpenAt,
                checkinCloseAt,
                attendanceCount
              }) => (
              <tr key={session.id}>
                <td>
                  <ClientDateTime value={startAt} format="datetime" />
                </td>
                <td>
                  <ClientDateTime value={checkinOpenAt} format="time" /> -{" "}
                  <ClientDateTime value={checkinCloseAt} format="time" />
                </td>
                <td>
                  <span className={badgeClass}>{status}</span>
                </td>
                <td>
                  <SessionAttendanceModal
                    sessionId={session.id}
                    seriesId={params.seriesId}
                    count={attendanceCount}
                  />
                </td>
                <td>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {status !== "CLOSED" ? (
                      <Link
                        href={`/tv/${session.id}`}
                        className="button-link secondary"
                      >
                        TV mode
                      </Link>
                    ) : null}
                    <DeleteSessionButton sessionId={session.id} />
                  </div>
                </td>
              </tr>
            )
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}
