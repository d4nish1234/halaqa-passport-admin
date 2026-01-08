import Link from "next/link";
import { redirect } from "next/navigation";
import { getSeries, updateSeriesDetails, updateSeriesStatus } from "@/lib/data/series";
import { getSessionUser } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";
import { canManageSeries } from "@/lib/auth/series";

async function updateSeriesAction(formData: FormData) {
  "use server";
  const seriesId = String(formData.get("seriesId") ?? "").trim();
  const isActive = formData.get("isActive") === "on";
  const completed = formData.get("completed") === "on";
  const name = String(formData.get("name") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  if (!seriesId) return;

  const currentSeries = await getSeries(seriesId);
  const user = await getSessionUser();
  if (!user?.email || !currentSeries) return;
  const isAdmin = isAdminEmail(user.email);
  if (!canManageSeries({ email: user.email, series: currentSeries, isAdmin })) return;

  if (currentSeries.isActive && name && startDate) {
    await updateSeriesDetails(seriesId, {
      name,
      startDate: new Date(startDate)
    });
  }

  await updateSeriesStatus(seriesId, { isActive, completed });
  redirect("/admin/series");
}

export default async function EditSeriesPage({
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

  const startDateValue = series.startDate
    ? series.startDate.toDate().toISOString().slice(0, 10)
    : "";

  return (
    <section className="card" style={{ maxWidth: 560 }}>
      <h2>Edit series</h2>
      <p style={{ color: "var(--muted)" }}>
        Series name and start date can be edited while the series is active.
      </p>
      <form action={updateSeriesAction}>
        <input type="hidden" name="seriesId" value={series.id} />
        <label>
          Name
          <input
            type="text"
            name="name"
            defaultValue={series.name}
            disabled={!series.isActive}
            required={series.isActive}
          />
        </label>
        <label>
          Start date
          <input
            type="date"
            name="startDate"
            defaultValue={startDateValue}
            disabled={!series.isActive}
            required={series.isActive}
          />
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={series.isActive}
            style={{ width: "auto" }}
          />
          Active
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            name="completed"
            defaultChecked={series.completed}
            style={{ width: "auto" }}
          />
          Completed
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="submit">Save changes</button>
          <Link href="/admin/series">
            <button type="button" className="secondary">
              Cancel
            </button>
          </Link>
        </div>
      </form>
    </section>
  );
}
