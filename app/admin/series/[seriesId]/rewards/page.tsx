import Link from "next/link";
import { redirect } from "next/navigation";
import { getSeries, updateSeriesRewards } from "@/lib/data/series";
import { getSessionUser } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";
import RewardsForm from "@/components/RewardsForm";

async function updateRewardsAction(formData: FormData) {
  "use server";
  const seriesId = String(formData.get("seriesId") ?? "").trim();
  if (!seriesId) return;

  const [user, series] = await Promise.all([
    getSessionUser(),
    getSeries(seriesId)
  ]);
  if (!user?.email || !series) return;
  const isAdmin = isAdminEmail(user.email);
  if (!isAdmin && series.createdBy !== user.email) return;

  const rawThresholds = formData.getAll("thresholds");
  const thresholds = Array.from(
    new Set(
      rawThresholds
        .map((value) => Number(String(value).trim()))
        .filter((value) => Number.isFinite(value) && value > 0)
        .map((value) => Math.floor(value))
    )
  ).sort((a, b) => a - b);

  await updateSeriesRewards(seriesId, thresholds);
  redirect(`/admin/series/${seriesId}/rewards`);
}

export default async function RewardsPage({
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
    redirect("/admin");
  }

  return (
    <section className="card" style={{ maxWidth: 640 }}>
      <h2>Rewards for {series.name}</h2>
      <p style={{ color: "var(--muted)" }}>
        Add check-in thresholds to unlock awards in the mobile app.
      </p>
      <RewardsForm
        seriesId={series.id}
        initialRewards={series.rewards ?? []}
        action={updateRewardsAction}
      />
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
