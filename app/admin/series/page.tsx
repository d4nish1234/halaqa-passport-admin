import Link from "next/link";
import { redirect } from "next/navigation";
import { createNewSeries, listSeries, updateSeriesStatus } from "@/lib/data/series";
import { formatDate } from "@/lib/data/format";

async function createSeriesAction(formData: FormData) {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  const isActive = formData.get("isActive") === "on";

  if (!name || !startDate) {
    return;
  }

  await createNewSeries({
    name,
    startDate: new Date(startDate) as any,
    isActive
  });

  redirect("/admin/series");
}

async function updateSeriesAction(formData: FormData) {
  "use server";
  const seriesId = String(formData.get("seriesId") ?? "").trim();
  const isActive = formData.get("isActive") === "on";
  const completed = formData.get("completed") === "on";
  if (!seriesId) return;
  await updateSeriesStatus(seriesId, { isActive, completed });
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
                <th>Start</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {series.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{formatDate(item.startDate)}</td>
                  <td>
                    {item.completed ? "Completed" : item.isActive ? "Active" : "Inactive"}
                  </td>
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
                      <form action={updateSeriesAction}>
                        <input type="hidden" name="seriesId" value={item.id} />
                        <label
                          style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                            marginBottom: 6
                          }}
                        >
                          <input
                            type="checkbox"
                            name="isActive"
                            defaultChecked={item.isActive}
                            style={{ width: "auto" }}
                          />
                          Active
                        </label>
                        <label
                          style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                            marginBottom: 6
                          }}
                        >
                          <input
                            type="checkbox"
                            name="completed"
                            defaultChecked={item.completed}
                            style={{ width: "auto" }}
                          />
                          Completed
                        </label>
                        <button type="submit" className="secondary">
                          Update
                        </button>
                      </form>
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
