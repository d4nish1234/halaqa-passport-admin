"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import InlineNicknameEditor from "@/components/InlineNicknameEditor";

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
  level: number;
  xpTotal: number;
  xpCurrentLevelAt: number;
  xpNextLevelAt: number;
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

function getMedal(rank: number): string | null {
  if (rank === 1) return "\uD83E\uDD47";
  if (rank === 2) return "\uD83E\uDD48";
  if (rank === 3) return "\uD83E\uDD49";
  return null;
}

function getLevelTier(level: number): string {
  if (level <= 3) return "tier-low";
  if (level <= 6) return "tier-mid";
  return "tier-high";
}

function getXpProgress(entry: LeaderboardEntry): number {
  const range = entry.xpNextLevelAt - entry.xpCurrentLevelAt;
  if (range <= 0) return 100;
  const progress = entry.xpTotal - entry.xpCurrentLevelAt;
  return Math.min(100, Math.max(0, (progress / range) * 100));
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
  const [leaderboardKey, setLeaderboardKey] = useState(0);
  const router = useRouter();
  const pollsRemainingRef = useRef(pollsRemaining);
  const leaderboardPollsRemainingRef = useRef(leaderboardPollsRemaining);
  const prevLeaderboardLengthRef = useRef(0);
  const appQrRef = useRef<HTMLDivElement | null>(null);

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
        const entries = payload.leaderboard ?? [];
        if (entries.length !== prevLeaderboardLengthRef.current) {
          setLeaderboardKey((k) => k + 1);
          prevLeaderboardLengthRef.current = entries.length;
        }
        setLeaderboard(entries);
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
  const serverTimeLabel = useMemo(() => {
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
  const androidUrl = androidAppUrl?.trim() ?? "";
  const iosUrl = iosAppUrl?.trim() ?? "";
  const hasAppLinks = Boolean(androidUrl || iosUrl);

  const statusClass =
    status === "OPEN" ? "open" : status === "CLOSED" ? "closed" : "upcoming";

  return (
    <div className="tv-shell">
      {/* Floating background shapes */}
      <div className="tv-bg-shapes">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      {/* Back button */}
      <div className="tv-back">
        <button
          type="button"
          className="secondary"
          onClick={() => router.back()}
        >
          Back
        </button>
      </div>

      {/* Header */}
      <div className="tv-header">
        <h1 className="tv-title">
          {data.seriesName ?? "Halaqa Passport"}
        </h1>
        <div className={`tv-status-badge ${statusClass}`}>
          {status === "OPEN" && <span className="tv-status-dot" />}
          {status}
        </div>
      </div>

      {/* Check-in times */}
      <div className="tv-meta">
        {data.checkinOpenAt && data.checkinCloseAt ? (
          <span>
            Check-in: {new Date(data.checkinOpenAt).toLocaleTimeString()} -{" "}
            {new Date(data.checkinCloseAt).toLocaleTimeString()}
          </span>
        ) : (
          "Check-in times not set"
        )}
      </div>

      <div className="tv-meta">
        Bring the same phone to your next session. Deleting the app will reset
        progress.
      </div>

      {/* Main content: QR + Leaderboard */}
      <div className="tv-main">
        {/* QR Code Card */}
        {qrMode === "session" && (
          <div className={`tv-qr-card ${statusClass}`}>
            <QRCodeCanvas
              value={payload}
              size={360}
              bgColor="#ffffff"
              fgColor="#1b1a17"
              level="H"
            />
            <div className="tv-qr-label">Scan to Check In</div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="tv-leaderboard">
          <div className="tv-leaderboard-heading">
            Series Leaderboard
          </div>
          {leaderboard.length === 0 ? (
            <div className="tv-meta">No attendance yet.</div>
          ) : (
            <div className="tv-leaderboard-list" key={leaderboardKey}>
              {leaderboard.map((entry, index) => {
                const rank = index + 1;
                const medal = getMedal(rank);
                const suffix = entry.participantId.slice(-4);
                const name = entry.nickname?.trim()
                  ? `${entry.nickname} (${suffix})`
                  : `Participant (${suffix})`;
                const tier = getLevelTier(entry.level);
                const xpPercent = getXpProgress(entry);
                const rankClass =
                  rank <= 3 ? `rank-${rank}` : "";

                return (
                  <div
                    key={entry.participantId}
                    className={`tv-leaderboard-row ${rankClass}`}
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className={`tv-rank ${rankClass}`}>
                      {medal ?? rank}
                    </div>
                    <div className="tv-participant-info">
                      <div className="tv-participant-name">
                        <span>{name}</span>
                        <span className={`tv-level-pill ${tier}`}>
                          Lv {entry.level}
                        </span>
                        <InlineNicknameEditor
                          seriesId={data.seriesId}
                          participantId={entry.participantId}
                          nickname={entry.nickname}
                          onUpdated={(next) =>
                            setLeaderboard((prev) =>
                              prev.map((item) =>
                                item.participantId === entry.participantId
                                  ? { ...item, nickname: next }
                                  : item
                              )
                            )
                          }
                        />
                      </div>
                      <div className="tv-xp-bar">
                        <div
                          className={`tv-xp-fill ${tier}`}
                          style={{ width: `${xpPercent}%` }}
                        />
                      </div>
                    </div>
                    <div className="tv-attendance-count">
                      <span className="tv-attendance-number">
                        {entry.count}
                      </span>
                      <span className="tv-attendance-label">sessions</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer area */}
      <div className="tv-footer">
        {serverTimeLabel && (
          <div className="tv-meta">Server time: {serverTimeLabel}</div>
        )}
        {!pollingActive && (
          <div className="tv-meta">
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
        <div className="tv-meta">
          <button
            type="button"
            className="secondary"
            disabled={!hasAppLinks}
            onClick={() =>
              setQrMode((prev) => {
                const next = prev === "session" ? "apps" : "session";
                if (next === "apps") {
                  requestAnimationFrame(() =>
                    appQrRef.current?.scrollIntoView({ behavior: "smooth" })
                  );
                } else {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
                return next;
              })
            }
          >
            {qrMode === "session" ? "Show app downloads" : "Show session QR"}
          </button>
        </div>
      </div>

      {/* App download QR codes */}
      {qrMode === "apps" && (
        <div className="tv-app-qr" ref={appQrRef}>
          <div className="tv-app-qr-item">
            {androidUrl ? (
              <div className="tv-qr-card">
                <QRCodeCanvas
                  value={androidUrl}
                  size={280}
                  bgColor="#ffffff"
                  fgColor="#1b1a17"
                  level="H"
                />
                <div className="tv-qr-label">Android app</div>
              </div>
            ) : (
              <div className="tv-meta">Android link not set</div>
            )}
          </div>
          <div className="tv-app-qr-item">
            {iosUrl ? (
              <div className="tv-qr-card">
                <QRCodeCanvas
                  value={iosUrl}
                  size={280}
                  bgColor="#ffffff"
                  fgColor="#1b1a17"
                  level="H"
                />
                <div className="tv-qr-label">iOS app</div>
              </div>
            ) : (
              <div className="tv-meta">iOS link not set</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
