import Link from "next/link";
import { redirect } from "next/navigation";
import crypto from "crypto";
import {
  getSeries,
  updateSeriesDetails,
  updateSeriesStatus,
  updateSeriesRewards,
  updateSeriesManagers
} from "@/lib/data/series";
import { listSessions, createSession } from "@/lib/data/sessions";
import { listAttendance } from "@/lib/data/attendance";
import { getParticipantsByIds } from "@/lib/data/participants";
import { formatDateTime, parseLocalDateTime } from "@/lib/data/format";
import { getSessionUser } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";
import { canManageSeries, authorizeForSeries } from "@/lib/auth/series";
import DeleteSessionButton from "@/components/DeleteSessionButton";
import RewardsForm from "@/components/RewardsForm";
import AttendanceExportLink from "@/components/AttendanceExportLink";
import CreateSessionModal from "@/components/CreateSessionModal";
import EditSeriesModal from "@/components/EditSeriesModal";
import ClientDateTime from "@/components/ClientDateTime";
import AttendeeRow from "@/components/AttendeeRow";
import CreateRecurringSessionsModal from "@/components/CreateRecurringSessionsModal";
import Breadcrumbs from "@/components/Breadcrumbs";
import Toast from "@/components/Toast";
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

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

async function createSessionAction(formData: FormData) {
  "use server";
  const seriesId = String(formData.get("seriesId") ?? "").trim();
  if (!seriesId) return;

  const auth = await authorizeForSeries(seriesId);
  if (!auth || !auth.series.isActive || auth.series.completed) return;

  const startAtInput = String(formData.get("startAt") ?? "").trim();
  const checkinOpenAtInput = String(formData.get("checkinOpenAt") ?? "").trim();
  const checkinCloseAtInput = String(formData.get("checkinCloseAt") ?? "").trim();
  const timezoneOffset = Number(formData.get("timezoneOffset") ?? 0);

  if (!checkinOpenAtInput || !checkinCloseAtInput) return;

  const effectiveStartAtInput = startAtInput || checkinOpenAtInput;
  const startAt = parseLocalDateTime(effectiveStartAtInput, timezoneOffset);
  const checkinOpenAt = parseLocalDateTime(checkinOpenAtInput, timezoneOffset);
  const checkinCloseAt = parseLocalDateTime(checkinCloseAtInput, timezoneOffset);
  if (!startAt || !checkinOpenAt || !checkinCloseAt) return;

  const token = crypto.randomBytes(6).toString("hex");
  await createSession({
    seriesId,
    startAt,
    checkinOpenAt,
    checkinCloseAt,
    token,
    createdBy: auth.user.email
  });

  redirect(`/admin/series/${seriesId}?session=1`);
}

async function createRecurringSessionsAction(formData: FormData) {
  "use server";
  const seriesId = String(formData.get("seriesId") ?? "").trim();
  if (!seriesId) return;

  const auth = await authorizeForSeries(seriesId);
  if (!auth || !auth.series.isActive || auth.series.completed) return;

  const timezoneOffset = Number(formData.get("timezoneOffset") ?? 0);
  const rawOccurrences = formData.getAll("occurrences");
  if (rawOccurrences.length === 0) return;

  for (const raw of rawOccurrences) {
    const [checkinOpenInput, checkinCloseInput] = String(raw).split("|");
    if (!checkinOpenInput || !checkinCloseInput) continue;

    const checkinOpenAt = parseLocalDateTime(checkinOpenInput, timezoneOffset);
    const checkinCloseAt = parseLocalDateTime(checkinCloseInput, timezoneOffset);
    if (!checkinOpenAt || !checkinCloseAt) continue;

    const token = crypto.randomBytes(6).toString("hex");
    await createSession({
      seriesId,
      startAt: checkinOpenAt,
      checkinOpenAt,
      checkinCloseAt,
      token,
      createdBy: auth.user.email
    });
  }

  redirect(`/admin/series/${seriesId}?session=1`);
}

async function updateRewardsAction(formData: FormData) {
  "use server";
  const seriesId = String(formData.get("seriesId") ?? "").trim();
  if (!seriesId) return;

  const auth = await authorizeForSeries(seriesId);
  if (!auth) return;

  const rawThresholds = formData.getAll("thresholds");
  const thresholds = Array.from(
    new Set(
      rawThresholds
        .map((value) => Number(String(value).trim()))
        .filter((value) => Number.isFinite(value) && value > 0)
        .map((value) => Math.floor(value))
    )
  ).sort((a, b) => a - b);

  await updateSeriesRewards(seriesId, thresholds);
  redirect(`/admin/series/${seriesId}?rewards=1`);
}

async function addManagerAction(formData: FormData) {
  "use server";
  const seriesId = String(formData.get("seriesId") ?? "").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!seriesId || !email) return;

  const auth = await authorizeForSeries(seriesId);
  if (!auth) return;
  if (!auth.isAdmin && auth.series.createdBy !== auth.user.email) return;

  if (email === auth.series.createdBy.toLowerCase()) {
    redirect(`/admin/series/${seriesId}`);
  }

  const managers = new Set((auth.series.managers ?? []).map((item) => item.toLowerCase()));
  managers.add(email);
  await updateSeriesManagers(seriesId, Array.from(managers).sort());
  redirect(`/admin/series/${seriesId}`);
}

async function removeManagerAction(formData: FormData) {
  "use server";
  const seriesId = String(formData.get("seriesId") ?? "").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!seriesId || !email) return;

  const auth = await authorizeForSeries(seriesId);
  if (!auth) return;
  if (!auth.isAdmin && auth.series.createdBy !== auth.user.email) return;

  const managers = (auth.series.managers ?? [])
    .map((item) => item.toLowerCase())
    .filter((item) => item !== email);
  await updateSeriesManagers(seriesId, managers);
  redirect(`/admin/series/${seriesId}`);
}

async function updateSeriesAction(formData: FormData) {
  "use server";
  const seriesId = String(formData.get("seriesId") ?? "").trim();
  const isActive = formData.get("isActive") === "on";
  const completed = formData.get("completed") === "on";
  const name = String(formData.get("name") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  if (!seriesId) return;

  const auth = await authorizeForSeries(seriesId);
  if (!auth) return;

  if (auth.series.isActive && name && startDate) {
    await updateSeriesDetails(seriesId, {
      name,
      startDate: new Date(startDate)
    });
  }

  await updateSeriesStatus(seriesId, { isActive, completed });
  redirect(`/admin/series/${seriesId}?updated=1`);
}

export default async function SeriesOverviewPage({
  params,
  searchParams
}: {
  params: { seriesId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
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
  if (!canManageSeries({ email: user.email, series, isAdmin })) {
    redirect("/admin");
  }
  const startDateValue = series.startDate
    ? series.startDate.toDate().toISOString().slice(0, 10)
    : "";
  const rewardsSaved = searchParams?.rewards === "1";
  const sessionCreated = searchParams?.session === "1";
  const seriesUpdated = searchParams?.updated === "1";

  const [sessions, attendance] = await Promise.all([
    listSessions(params.seriesId),
    listAttendance(params.seriesId)
  ]);

  const now = Date.now();
  const sessionsWithStatus = sessions.slice(0, 10).map((session) => {
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
    return { session, status, badgeClass, startAt, checkinOpenAt, checkinCloseAt };
  });

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

  const participantIds = attendance.map((record) => record.participantId);
  const participantsById = await getParticipantsByIds(participantIds);
  const displayName = (participantId: string) => {
    const nickname = participantsById.get(participantId)?.nickname?.trim();
    const suffix = participantId.slice(-4);
    if (!nickname) return participantId;
    return `${nickname} (${suffix})`;
  };

  const canEditPermissions = isAdmin || series.createdBy === user.email;
  const managers = (series.managers ?? []).map((email) => email.toLowerCase());

  return (
    <div className="grid cols-12">
      <Toast message="Session created successfully." visible={sessionCreated} />
      <Toast message="Series updated successfully." visible={seriesUpdated} />
      <Toast message="Rewards saved successfully." visible={rewardsSaved} />
      <div className="span-12">
        <Breadcrumbs
          items={[
            { label: "Series", href: "/admin/series" },
            { label: series.name }
          ]}
        />
      </div>
      <section className="card span-12">
        <div className="card-header">
          <h2>Series details</h2>
          <EditSeriesModal
            action={updateSeriesAction}
            seriesId={series.id}
            name={series.name}
            startDateValue={startDateValue}
            isActive={series.isActive}
            completed={series.completed}
          />
        </div>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Name</span>
            <span className="detail-value">{series.name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Start date</span>
            <span className="detail-value">{formatDateTime(series.startDate)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Status</span>
            <span className="detail-value">
              <span
                className={
                  series.completed
                    ? "badge closed"
                    : series.isActive
                    ? "badge"
                    : "badge upcoming"
                }
              >
                {series.completed
                  ? "Completed"
                  : series.isActive
                  ? "Active"
                  : "Inactive"}
              </span>
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Sessions</span>
            <span className="detail-value">{sessions.length}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Participants</span>
            <span className="detail-value">{sortedParticipants.length}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Created by</span>
            <span className="detail-value">{series.createdBy}</span>
          </div>
        </div>
      </section>
      <section className="card span-7">
        <div className="card-header">
          <h2>Recent sessions</h2>
          <Link href={`/admin/series/${params.seriesId}/sessions`}>
            <button type="button" className="secondary">
              View all
            </button>
          </Link>
        </div>
        {series.isActive && !series.completed ? (
          <div className="card-actions">
            <CreateSessionModal
              action={createSessionAction}
              disabled={false}
              seriesId={series.id}
            />
            <CreateRecurringSessionsModal
              action={createRecurringSessionsAction}
              disabled={false}
              seriesId={series.id}
            />
          </div>
        ) : (
          <p style={{ color: "var(--muted)" }}>
            This series is inactive or completed. Reactivate it to create new
            sessions.
          </p>
        )}
        {sessionsWithStatus.length === 0 ? (
          <div className="empty-state">
            <p>No sessions yet.</p>
            {series.isActive && !series.completed ? (
              <p style={{ color: "var(--muted)", fontSize: 13 }}>
                Create a session above to generate a QR code for check-ins.
              </p>
            ) : null}
          </div>
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
                ({ session, status, badgeClass, startAt, checkinOpenAt, checkinCloseAt }) => (
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
                  <td>{sessionCounts.get(session.id) ?? 0}</td>
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

      <section className="card span-5">
        <div className="card-header">
          <h2>Top attendees</h2>
          <Link href={`/admin/series/${params.seriesId}/attendees`}>
            <button type="button" className="secondary">
              View all
            </button>
          </Link>
        </div>
        <div className="card-actions">
          <AttendanceExportLink
            seriesId={params.seriesId}
            label="Export Attendance"
            className="secondary"
          />
        </div>
        {sortedParticipants.length === 0 ? (
          <div className="empty-state">
            <p>No attendance records yet.</p>
          </div>
        ) : (
          <div className="list-divided">
            {sortedParticipants.slice(0, 10).map(([participantId, count]) => (
              <AttendeeRow
                key={participantId}
                seriesId={params.seriesId}
                participantId={participantId}
                nickname={participantsById.get(participantId)?.nickname?.trim() ?? null}
                count={count}
              />
            ))}
          </div>
        )}
        <div className="perfect-attendance-section">
          <h3>Perfect attendance</h3>
          {perfectAttendance.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>
              {sessions.length === 0
                ? "No sessions yet."
                : "No one has attended every session yet."}
            </p>
          ) : (
            <div className="perfect-attendance-list">
              {perfectAttendance.map(([participantId]) => (
                <span key={participantId} className="perfect-attendance-pill">
                  {displayName(participantId)}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="card span-6">
        <h2>Rewards</h2>
        <p style={{ color: "var(--muted)" }}>
          Add check-in thresholds to unlock awards in the mobile app.
        </p>
        <RewardsForm
          seriesId={series.id}
          initialRewards={series.rewards ?? []}
          action={updateRewardsAction}
        />
      </section>

      <section className="card span-6">
        <h2>Permissions</h2>
        {canEditPermissions ? (
          <>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 12 }}>
              Add staff who can manage sessions, rewards, and attendance.
            </p>
            <form action={addManagerAction} className="perm-add-form">
              <input type="hidden" name="seriesId" value={series.id} />
              <div className="perm-add-row">
                <input type="email" name="email" placeholder="name@domain.com" />
                <button type="submit">Add</button>
              </div>
            </form>
            <div className="perm-list">
              <div className="perm-card">
                <div className="perm-card-avatar">
                  {series.createdBy.charAt(0).toUpperCase()}
                </div>
                <div className="perm-card-info">
                  <span className="perm-card-email">{series.createdBy}</span>
                  <span className="badge" style={{ fontSize: 11, padding: "2px 8px" }}>Owner</span>
                </div>
              </div>
              {managers.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
                  No additional managers yet.
                </p>
              ) : (
                managers.map((email) => (
                  <div key={email} className="perm-card">
                    <div className="perm-card-avatar">
                      {email.charAt(0).toUpperCase()}
                    </div>
                    <div className="perm-card-info">
                      <span className="perm-card-email">{email}</span>
                      <span style={{ color: "var(--muted)", fontSize: 12 }}>Manager</span>
                    </div>
                    <form action={removeManagerAction}>
                      <input type="hidden" name="seriesId" value={series.id} />
                      <input type="hidden" name="email" value={email} />
                      <button type="submit" className="secondary danger" style={{ padding: "6px 10px", fontSize: 12 }}>
                        Remove
                      </button>
                    </form>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <p>You don&apos;t have permission to manage access.</p>
            <p style={{ fontSize: 13 }}>
              Contact {series.createdBy} to manage users for this series.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
