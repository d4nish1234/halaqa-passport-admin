import TvSessionDisplay, { type TvSessionData } from "@/components/TvSessionDisplay";
import { getSession } from "@/lib/data/sessions";
import { getSeries } from "@/lib/data/series";

function toIso(value: any) {
  if (!value) return null;
  const date = value.toDate ? value.toDate() : value;
  return date.toISOString();
}

export default async function TvPage({
  params
}: {
  params: { sessionId: string };
}) {
  const session = await getSession(params.sessionId);
  if (!session) {
    return (
      <div className="tv-shell">
        <h1>Session not found</h1>
      </div>
    );
  }

  const series = await getSeries(session.seriesId);

  const data: TvSessionData = {
    id: session.id,
    seriesId: session.seriesId,
    seriesName: series?.name ?? null,
    startAt: toIso(session.startAt),
    checkinOpenAt: toIso(session.checkinOpenAt),
    checkinCloseAt: toIso(session.checkinCloseAt),
    token: session.token,
    serverTime: new Date().toISOString()
  };

  return <TvSessionDisplay sessionId={params.sessionId} initialData={data} />;
}
