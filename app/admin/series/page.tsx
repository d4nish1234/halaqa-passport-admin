import Link from "next/link";
import { redirect } from "next/navigation";
import { createNewSeries, listSeriesForUser } from "@/lib/data/series";
import { formatDate } from "@/lib/data/format";
import { getSessionUser } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";

async function createSeriesAction(formData: FormData) {
  "use server";
  const user = await getSessionUser();
  if (!user?.email) return;
  const name = String(formData.get("name") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  const isActive = formData.get("isActive") === "on";

  if (!name || !startDate) {
    return;
  }

  await createNewSeries({
    name,
    startDate: new Date(startDate) as any,
    isActive,
    createdBy: user.email
  });

  redirect("/admin/series");
}

export default async function SeriesPage() {
  const user = await getSessionUser();
  if (!user?.email) {
    return null;
  }
  const isAdmin = isAdminEmail(user.email);
  const series = await listSeriesForUser({ email: user.email, isAdmin });

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
                    <details className="action-menu">
                      <summary className="action-menu-trigger">...</summary>
                      <div className="action-menu-items">
                        <Link
                          href={`/admin/series/${item.id}/sessions`}
                          className="action-menu-item"
                        >
                          Sessions
                        </Link>
                        <Link
                          href={`/admin/series/${item.id}/attendance`}
                          className="action-menu-item"
                        >
                          Attendance
                        </Link>
                        <Link
                          href={`/admin/series/${item.id}/rewards`}
                          className="action-menu-item"
                        >
                          Rewards
                        </Link>
                        <Link
                          href={`/admin/series/${item.id}/edit`}
                          className="action-menu-item"
                        >
                          Edit
                        </Link>
                      </div>
                    </details>
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
