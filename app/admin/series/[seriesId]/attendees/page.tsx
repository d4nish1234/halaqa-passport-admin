import Link from "next/link";
import { redirect } from "next/navigation";
import { getSeries } from "@/lib/data/series";
import { listAttendance } from "@/lib/data/attendance";
import { getParticipantsByIds } from "@/lib/data/participants";
import { getSessionUser } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";
import { canManageSeries } from "@/lib/auth/series";
import AttendeeRow from "@/components/AttendeeRow";
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

  const attendance = await listAttendance(params.seriesId);
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
        <h2>All attendees for {series.name}</h2>
        <Link href={`/admin/series/${params.seriesId}`}>
          <button type="button" className="secondary">
            Back to series
          </button>
        </Link>
      </div>
      {sortedParticipants.length === 0 ? (
        <p>No attendance records yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Participant</th>
              <th>Sessions attended</th>
              <th />
            </tr>
          </thead>
          <tbody>
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
          </tbody>
        </table>
      )}
    </section>
    </div>
  );
}
