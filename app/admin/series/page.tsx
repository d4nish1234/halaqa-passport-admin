import { redirect } from "next/navigation";
import { createNewSeries, listSeriesForUser } from "@/lib/data/series";
import { formatDate } from "@/lib/data/format";
import { getSessionUser } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";
import CreateSeriesModal from "@/components/CreateSeriesModal";
import SeriesRow from "@/components/SeriesRow";
import Toast from "@/components/Toast";

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

  redirect(`/admin/series?created=1&t=${Date.now()}`);
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
  const toastKey = String(searchParams?.t ?? "");
  const justCreated = searchParams?.created === "1";
  const activeSeries = series.filter((item) => item.isActive && !item.completed);
  const inactiveSeries = series.filter((item) => !item.isActive || item.completed);

  return (
    <div>
      <Toast key={toastKey} message="Series created successfully." visible={justCreated} />

      <section className="card">
        <div className="card-header">
          <h2>Active series</h2>
          <CreateSeriesModal action={createSeriesAction} openOnLoad={openOnLoad} />
        </div>
        {activeSeries.length === 0 ? (
          <div className="empty-state">
            <p>No active series yet.</p>
            <p style={{ fontSize: 13 }}>
              Create a series to start tracking attendance.
            </p>
          </div>
        ) : (
          <div className="list-divided">
            {activeSeries.map((item) => (
              <SeriesRow
                key={item.id}
                href={`/admin/series/${item.id}`}
                name={item.name}
                startDate={formatDate(item.startDate)}
                createdBy={isAdmin ? item.createdBy : null}
                status={
                  item.completed ? "Completed" : item.isActive ? "Active" : "Inactive"
                }
              />
            ))}
          </div>
        )}
      </section>

      {inactiveSeries.length > 0 && (
        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <h2>Inactive / Completed</h2>
          </div>
          <div className="list-divided">
            {inactiveSeries.map((item) => (
              <SeriesRow
                key={item.id}
                href={`/admin/series/${item.id}`}
                name={item.name}
                startDate={formatDate(item.startDate)}
                createdBy={isAdmin ? item.createdBy : null}
                status={
                  item.completed ? "Completed" : item.isActive ? "Active" : "Inactive"
                }
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
