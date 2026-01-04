import Link from "next/link";
import { redirect } from "next/navigation";
import { createSeries, listSeries } from "@/lib/data/series";
import { formatDate } from "@/lib/data/format";

async function createSeriesAction(formData: FormData) {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  const endDate = String(formData.get("endDate") ?? "").trim();
  const isActive = formData.get("isActive") === "on";

  if (!name || !startDate || !endDate) {
    return;
  }

  await createSeries({
    name,
    startDate: new Date(startDate) as any,
    endDate: new Date(endDate) as any,
    isActive
  });

  redirect("/admin/series");
}

export default async function SeriesPage() {
  const series = await listSeries();

  return (
    <div className="grid cols-2">
      <section className="card">
        <h2>Series</h2>
        {series.length === 0 ? (
          <p>No series yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Dates</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {series.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>
                    {formatDate(item.startDate)} - {formatDate(item.endDate)}
                  </td>
                  <td>{item.isActive ? "Active" : "Inactive"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Link href={`/admin/series/${item.id}/sessions`}>
                        <button type="button" className="secondary">
                          Sessions
                        </button>
                      </Link>
                      <Link href={`/admin/series/${item.id}/attendance`}>
                        <button type="button" className="secondary">
                          Attendance
                        </button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <section className="card">
        <h2>Create series</h2>
        <form action={createSeriesAction}>
          <label>
            Name
            <input name="name" placeholder="Spring 2025" required />
          </label>
          <label>
            Start date
            <input type="date" name="startDate" required />
          </label>
          <label>
            End date
            <input type="date" name="endDate" required />
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" name="isActive" style={{ width: "auto" }} />
            Active series
          </label>
          <button type="submit">Create series</button>
        </form>
      </section>
    </div>
  );
}
