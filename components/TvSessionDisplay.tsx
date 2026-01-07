"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

export type TvSessionData = {
  id: string;
  seriesId: string;
  seriesName: string | null;
  startAt: string | null;
  checkinOpenAt: string | null;
  checkinCloseAt: string | null;
  token: string | null;
  serverTime?: string | null;
};

type LeaderboardEntry = {
  participantId: string;
  nickname: string | null;
  count: number;
};

type LeaderboardResponse = {
  leaderboard: LeaderboardEntry[];
};

function getStatus(data: TvSessionData, now: number) {
  if (!data.checkinOpenAt || !data.checkinCloseAt) return "UNKNOWN";
  const openAt = new Date(data.checkinOpenAt).getTime();
  const closeAt = new Date(data.checkinCloseAt).getTime();

  if (now < openAt) return "UPCOMING";
  if (now > closeAt) return "CLOSED";
  return "OPEN";
}

export default function TvSessionDisplay({
  sessionId,
  initialData,
  androidAppUrl,
  iosAppUrl
}: {
  sessionId: string;
  initialData: TvSessionData;
  androidAppUrl?: string | null;
  iosAppUrl?: string | null;
}) {
  const [data, setData] = useState(initialData);
  const [now, setNow] = useState(Date.now());
  const [pollingActive, setPollingActive] = useState(true);
  const [pollsRemaining, setPollsRemaining] = useState(16);
  const [leaderboardPollsRemaining, setLeaderboardPollsRemaining] = useState(8);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [qrMode, setQrMode] = useState<"session" | "apps">("session");
  const pollsRemainingRef = useRef(pollsRemaining);
  const leaderboardPollsRemainingRef = useRef(leaderboardPollsRemaining);

  useEffect(() => {
    pollsRemainingRef.current = pollsRemaining;
  }, [pollsRemaining]);

  useEffect(() => {
    leaderboardPollsRemainingRef.current = leaderboardPollsRemaining;
  }, [leaderboardPollsRemaining]);

  useEffect(() => {
    const refresh = async () => {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        cache: "no-store"
      });
      if (response.ok) {
        const payload = await response.json();
        setData(payload);
      }
    };

    if (!pollingActive) return;

    const intervalId = window.setInterval(async () => {
      if (pollsRemainingRef.current <= 0) {
        setPollingActive(false);
        return;
      }

      await refresh();
      setPollsRemaining((remaining) => {
        const next = Math.max(remaining - 1, 0);
        if (next === 0) {
          setPollingActive(false);
        }
        return next;
      });
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [pollingActive, sessionId]);

  useEffect(() => {
    if (!pollingActive) return;

    const refreshLeaderboard = async () => {
      const response = await fetch(`/api/series/${data.seriesId}/leaderboard`, {
        cache: "no-store"
      });
      if (response.ok) {
        const payload = (await response.json()) as LeaderboardResponse;
        setLeaderboard(payload.leaderboard ?? []);
      }
    };

    const intervalId = window.setInterval(async () => {
      if (leaderboardPollsRemainingRef.current <= 0) {
        return;
      }

      await refreshLeaderboard();
      setLeaderboardPollsRemaining((remaining) => Math.max(remaining - 1, 0));
    }, 30000);

    refreshLeaderboard();
    setLeaderboardPollsRemaining((remaining) => Math.max(remaining - 1, 0));

    return () => window.clearInterval(intervalId);
  }, [data.seriesId, pollingActive]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const status = useMemo(() => getStatus(data, now), [data, now]);
  const payload = useMemo(
    () =>
      JSON.stringify({
        seriesId: data.seriesId,
        sessionId: data.id,
        token: data.token
      }),
    [data]
  );
  const serverTimeEasternLabel = useMemo(() => {
    if (!data.serverTime) return null;
    const date = new Date(data.serverTime);
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short"
    }).format(date);
  }, [data.serverTime]);
  const serverTimeUtcLabel = useMemo(() => {
    if (!data.serverTime) return null;
    const date = new Date(data.serverTime);
    return date.toUTCString();
  }, [data.serverTime]);
  const androidUrl = androidAppUrl?.trim() ?? "";
  const iosUrl = iosAppUrl?.trim() ?? "";
  const hasAppLinks = Boolean(androidUrl || iosUrl);

  return (
    <div className="tv-shell">
      <h1>{data.seriesName ?? "Halaqa Passport"}</h1>
      <div className="status">
        <span
          className={`badge ${
            status === "OPEN"
              ? ""
              : status === "CLOSED"
              ? "closed"
              : "upcoming"
          }`}
        >
          {status}
        </span>
      </div>
      <div className="meta">
        {data.checkinOpenAt && data.checkinCloseAt ? (
          <span>
            Check-in: {new Date(data.checkinOpenAt).toLocaleTimeString()} -
            {" "}
            {new Date(data.checkinCloseAt).toLocaleTimeString()}
          </span>
        ) : (
          "Check-in times not set"
        )}
      </div>
      <div className="meta">
        Bring the same phone to your next session. Deleting the app will reset
        progress.
      </div>
      <div className="tv-main">
        <div className="tv-qr">
          {qrMode === "session" ? (
            <QRCodeCanvas
              value={payload}
              size={360}
              bgColor="#ffffff"
              fgColor="#1b1a17"
              level="H"
            />
          ) : null}
        </div>
        <div className="tv-leaderboard">
          <div className="meta">Series leaderboard (so far)</div>
          {leaderboard.length === 0 ? (
            <div className="meta">No attendance yet.</div>
          ) : (
            <div className="tv-leaderboard-list">
              {leaderboard.map((entry) => {
                const suffix = entry.participantId.slice(-4);
                const name = entry.nickname?.trim()
                  ? `${entry.nickname} (${suffix})`
                  : `Participant (${suffix})`;
                return (
                  <div key={entry.participantId} className="tv-leaderboard-row">
                    <span>{name}</span>
                    <span>{entry.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {serverTimeEasternLabel && serverTimeUtcLabel && (
        <div className="meta">
          Server time: {serverTimeEasternLabel} | {serverTimeUtcLabel}
        </div>
      )}
      {!pollingActive && (
        <div className="meta">
          Auto-refresh paused.
          <button
            type="button"
            onClick={() => {
              setPollsRemaining(16);
              setLeaderboardPollsRemaining(8);
              setPollingActive(true);
            }}
            style={{ marginLeft: 12 }}
          >
            Resume updates
          </button>
        </div>
      )}
      <div className="meta">
        <button
          type="button"
          className="secondary"
          disabled={!hasAppLinks}
          onClick={() =>
            setQrMode((mode) => (mode === "session" ? "apps" : "session"))
          }
        >
          {qrMode === "session" ? "Show app downloads" : "Show session QR"}
        </button>
      </div>
      {qrMode === "apps" && (
        <div className="tv-app-qr">
          <div className="tv-app-qr-item">
            {androidUrl ? (
              <QRCodeCanvas
                value={androidUrl}
                size={280}
                bgColor="#ffffff"
                fgColor="#1b1a17"
                level="H"
              />
            ) : (
              <div className="meta">Android link not set</div>
            )}
            <div className="meta" style={{ marginTop: 8 }}>
              Android app
            </div>
          </div>
          <div className="tv-app-qr-item">
            {iosUrl ? (
              <QRCodeCanvas
                value={iosUrl}
                size={280}
                bgColor="#ffffff"
                fgColor="#1b1a17"
                level="H"
              />
            ) : (
              <div className="meta">iOS link not set</div>
            )}
            <div className="meta" style={{ marginTop: 8 }}>
              iOS app
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
