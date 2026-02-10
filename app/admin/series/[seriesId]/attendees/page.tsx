import Link from "next/link";
import { redirect } from "next/navigation";
import { getSeries } from "@/lib/data/series";
import { listSessions } from "@/lib/data/sessions";
import { listAttendance } from "@/lib/data/attendance";
import { getParticipantsByIds } from "@/lib/data/participants";
import { getSessionUser } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";
import { canManageSeries } from "@/lib/auth/series";
import AttendeeRow from "@/components/AttendeeRow";
import AttendanceExportLink from "@/components/AttendanceExportLink";
import Breadcrumbs from "@/components/Breadcrumbs";

export default async function SeriesAttendeesPage({
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
  if (!canManageSeries({ email: user.email, series, isAdmin })) {
    redirect("/admin");
  }

  const [sessions, attendance] = await Promise.all([
    listSessions(params.seriesId),
    listAttendance(params.seriesId)
  ]);
  const participantCounts = new Map<string, number>();
  for (const record of attendance) {
    participantCounts.set(
      record.participantId,
      (participantCounts.get(record.participantId) ?? 0) + 1
    );
  }

  const sortedParticipants = [...participantCounts.entries()].sort(
    (a, b) => b[1] - a[1]
  );
  const participantIds = attendance.map((record) => record.participantId);
  const participantsById = await getParticipantsByIds(participantIds);

  const perfectCount = sortedParticipants.filter(
    ([, count]) => count === sessions.length && sessions.length > 0
  ).length;

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Series", href: "/admin/series" },
          { label: series.name, href: `/admin/series/${params.seriesId}` },
          { label: "Attendees" }
        ]}
      />
    <section className="card">
      <div className="card-header">
        <h2>Attendees for {series.name}</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href={`/admin/series/${params.seriesId}`}>
            <button type="button" className="secondary">
              Back to series
            </button>
          </Link>
          {sortedParticipants.length > 0 && (
            <AttendanceExportLink
              seriesId={params.seriesId}
              label="Export CSV"
              className="secondary"
            />
          )}
        </div>
      </div>

      {sortedParticipants.length > 0 && (
        <div className="attendee-summary">
          <div className="attendee-summary-item">
            <span className="attendee-summary-value">{sortedParticipants.length}</span>
            <span className="attendee-summary-label">Total</span>
          </div>
          <div className="attendee-summary-item">
            <span className="attendee-summary-value">{sessions.length}</span>
            <span className="attendee-summary-label">Sessions</span>
          </div>
          <div className="attendee-summary-item">
            <span className="attendee-summary-value">{perfectCount}</span>
            <span className="attendee-summary-label">Perfect</span>
          </div>
        </div>
      )}

      {sortedParticipants.length === 0 ? (
        <div className="empty-state">
          <p>No attendance records yet.</p>
          <p style={{ fontSize: 13 }}>
            Participants will appear here once they check in to a session.
          </p>
        </div>
      ) : (
        <div className="list-divided">
          {sortedParticipants.map(([participantId, count]) => {
            const nickname =
              participantsById.get(participantId)?.nickname?.trim() ?? null;
            return (
              <AttendeeRow
                key={participantId}
                seriesId={params.seriesId}
                participantId={participantId}
                nickname={nickname}
                count={count}
              />
            );
          })}
        </div>
      )}
    </section>
    </div>
  );
}
