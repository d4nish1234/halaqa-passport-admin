import Link from "next/link";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { getSeries } from "@/lib/data/series";
import { createSession, listSessions, updateSessionToken } from "@/lib/data/sessions";
import { formatDateTime, formatTime } from "@/lib/data/format";

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
    const startAt = String(formData.get("startAt") ?? "").trim();
    const checkinOpenAt = String(formData.get("checkinOpenAt") ?? "").trim();
    const checkinCloseAt = String(formData.get("checkinCloseAt") ?? "").trim();

    if (!startAt || !checkinOpenAt || !checkinCloseAt) {
      return;
    }

    await createSession({
      seriesId: params.seriesId,
      startAt: new Date(startAt) as any,
      checkinOpenAt: new Date(checkinOpenAt) as any,
      checkinCloseAt: new Date(checkinCloseAt) as any
    });

    redirect(`/admin/series/${params.seriesId}/sessions`);
  }

  async function generateTokenAction(formData: FormData) {
    "use server";
    const sessionId = String(formData.get("sessionId") ?? "").trim();
    if (!sessionId) return;
    const token = crypto.randomBytes(6).toString("hex");
    await updateSessionToken(sessionId, token);
    redirect(`/admin/series/${params.seriesId}/sessions`);
  }

  const sessions = await listSessions(params.seriesId);

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
                <th>Token</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td>{formatDateTime(session.startAt)}</td>
                  <td>
                    {formatTime(session.checkinOpenAt)} - {formatTime(session.checkinCloseAt)}
                  </td>
                  <td>{session.token ?? "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <form action={generateTokenAction}>
                        <input type="hidden" name="sessionId" value={session.id} />
                        <button type="submit" className="secondary">
                          Generate token
                        </button>
                      </form>
                      <Link href={`/tv/${session.id}`}>TV mode</Link>
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
        <form action={createSessionAction}>
          <label>
            Session start
            <input type="datetime-local" name="startAt" required />
          </label>
          <label>
            Check-in opens
            <input type="datetime-local" name="checkinOpenAt" required />
          </label>
          <label>
            Check-in closes
            <input type="datetime-local" name="checkinCloseAt" required />
          </label>
          <button type="submit">Create session</button>
        </form>
        <p style={{ marginTop: 12, color: "var(--muted)" }}>
          Tokens are generated manually per session to avoid accidental rotation.
        </p>
      </section>
    </div>
  );
}
