import Link from "next/link";
import { redirect } from "next/navigation";
import { getSeries, updateSeriesManagers } from "@/lib/data/series";
import { getSessionUser } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

async function addManagerAction(formData: FormData) {
  "use server";
  const seriesId = String(formData.get("seriesId") ?? "").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!seriesId || !email) return;

  const [user, series] = await Promise.all([
    getSessionUser(),
    getSeries(seriesId)
  ]);
  if (!user?.email || !series) return;
  const isAdmin = isAdminEmail(user.email);
  if (!isAdmin && series.createdBy !== user.email) return;

  if (email === series.createdBy.toLowerCase()) {
    redirect(`/admin/series/${seriesId}/permissions`);
  }

  const managers = new Set((series.managers ?? []).map((item) => item.toLowerCase()));
  managers.add(email);
  await updateSeriesManagers(seriesId, Array.from(managers).sort());
  redirect(`/admin/series/${seriesId}/permissions`);
}

async function removeManagerAction(formData: FormData) {
  "use server";
  const seriesId = String(formData.get("seriesId") ?? "").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!seriesId || !email) return;

  const [user, series] = await Promise.all([
    getSessionUser(),
    getSeries(seriesId)
  ]);
  if (!user?.email || !series) return;
  const isAdmin = isAdminEmail(user.email);
  if (!isAdmin && series.createdBy !== user.email) return;

  const managers = (series.managers ?? [])
    .map((item) => item.toLowerCase())
    .filter((item) => item !== email);
  await updateSeriesManagers(seriesId, managers);
  redirect(`/admin/series/${seriesId}/permissions`);
}

export default async function SeriesPermissionsPage({
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
  if (!isAdmin && series.createdBy !== user.email) {
    return (
      <section className="card" style={{ maxWidth: 640 }}>
        <h2>Permissions</h2>
        <p style={{ color: "var(--muted)" }}>
          You do not have access to manage permissions for this series. Please
          contact {series.createdBy} to manage users for this series.
        </p>
        <div style={{ marginTop: 16 }}>
          <Link href="/admin/series">
            <button type="button" className="secondary">
              Back to series
            </button>
          </Link>
        </div>
      </section>
    );
  }

  const managers = (series.managers ?? []).map((email) => email.toLowerCase());

  return (
    <section className="card" style={{ maxWidth: 640 }}>
      <h2>Permissions for {series.name}</h2>
      <p style={{ color: "var(--muted)" }}>
        Add staff who can manage sessions, rewards, and attendance for this
        series.
      </p>
      <form action={addManagerAction} style={{ marginBottom: 16 }}>
        <input type="hidden" name="seriesId" value={series.id} />
        <label>
          Email address
          <input type="email" name="email" placeholder="name@domain.com" />
        </label>
        <button type="submit" style={{ marginTop: 8 }}>
          Add access
        </button>
      </form>
      <div style={{ display: "grid", gap: 8 }}>
        <div className="meta">Owner: {series.createdBy}</div>
        {managers.length === 0 ? (
          <div className="meta">No additional managers yet.</div>
        ) : (
          managers.map((email) => (
            <form
              key={email}
              action={removeManagerAction}
              style={{ display: "flex", gap: 8, alignItems: "center" }}
            >
              <input type="hidden" name="seriesId" value={series.id} />
              <input type="hidden" name="email" value={email} />
              <span>{email}</span>
              <button type="submit" className="secondary">
                Remove
              </button>
            </form>
          ))
        )}
      </div>
      <div style={{ marginTop: 16 }}>
        <Link href="/admin/series">
          <button type="button" className="secondary">
            Back to series
          </button>
        </Link>
      </div>
    </section>
  );
}
