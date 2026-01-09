import { redirect } from "next/navigation";
import { createNewSeries, listSeriesForUser } from "@/lib/data/series";
import { formatDate } from "@/lib/data/format";
import { getSessionUser } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";
import CreateSeriesModal from "@/components/CreateSeriesModal";
import SeriesRow from "@/components/SeriesRow";

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

export default async function SeriesPage({
  searchParams
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const user = await getSessionUser();
  if (!user?.email) {
    return null;
  }
  const isAdmin = isAdminEmail(user.email);
  const series = await listSeriesForUser({ email: user.email, isAdmin });
  const openOnLoad = searchParams?.new === "1";
  const activeSeries = series.filter((item) => item.isActive && !item.completed);
  const inactiveSeries = series.filter((item) => !item.isActive || item.completed);

  return (
    <div>
      <section className="card">
        <div className="card-header">
          <h2>Active series</h2>
          <CreateSeriesModal action={createSeriesAction} openOnLoad={openOnLoad} />
        </div>
        {activeSeries.length === 0 ? (
          <p>No series yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Start</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {activeSeries.map((item) => (
                <SeriesRow
                  key={item.id}
                  href={`/admin/series/${item.id}`}
                  name={item.name}
                  startDate={formatDate(item.startDate)}
                  status={
                    item.completed ? "Completed" : item.isActive ? "Active" : "Inactive"
                  }
                />
              ))}
            </tbody>
          </table>
        )}
      </section>
      <section className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <h2>Inactive/Completed series</h2>
        </div>
        {inactiveSeries.length === 0 ? (
          <p>No inactive series.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Start</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {inactiveSeries.map((item) => (
                <SeriesRow
                  key={item.id}
                  href={`/admin/series/${item.id}`}
                  name={item.name}
                  startDate={formatDate(item.startDate)}
                  status={
                    item.completed ? "Completed" : item.isActive ? "Active" : "Inactive"
                  }
                />
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
