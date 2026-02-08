"use client";

import { useMemo, useRef, useState } from "react";

type Props = {
  action: (formData: FormData) => void;
  disabled?: boolean;
  seriesId: string;
};

type Occurrence = {
  date: string;
  checkinOpen: string;
  checkinClose: string;
  removed: boolean;
};

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function CreateRecurringSessionsModal({
  action,
  disabled,
  seriesId
}: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const timezoneOffset = useMemo(() => new Date().getTimezoneOffset(), []);

  const [startDate, setStartDate] = useState("");
  const [checkinOpenTime, setCheckinOpenTime] = useState("");
  const [checkinCloseTime, setCheckinCloseTime] = useState("");
  const [repeatCount, setRepeatCount] = useState(4);
  const [intervalDays, setIntervalDays] = useState(7);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [step, setStep] = useState<"form" | "preview">("form");

  function generateOccurrences() {
    if (!startDate || !checkinOpenTime || !checkinCloseTime || repeatCount < 1) return;
    const items: Occurrence[] = [];
    for (let i = 0; i < repeatCount; i++) {
      const date = addDays(startDate, i * intervalDays);
      items.push({
        date,
        checkinOpen: `${date}T${checkinOpenTime}`,
        checkinClose: `${date}T${checkinCloseTime}`,
        removed: false
      });
    }
    setOccurrences(items);
    setStep("preview");
  }

  function toggleOccurrence(index: number) {
    setOccurrences((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, removed: !item.removed } : item
      )
    );
  }

  function reset() {
    setStartDate("");
    setCheckinOpenTime("");
    setCheckinCloseTime("");
    setRepeatCount(4);
    setIntervalDays(7);
    setOccurrences([]);
    setStep("form");
  }

  const activeOccurrences = occurrences.filter((item) => !item.removed);

  function formatPreviewDate(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  }

  return (
    <>
      <button
        type="button"
        className="secondary"
        disabled={disabled}
        onClick={() => {
          reset();
          dialogRef.current?.showModal();
        }}
      >
        + Recurring sessions
      </button>
      <dialog className="modal" ref={dialogRef}>
        <div className="modal-header">
          <h3>Create recurring sessions</h3>
          <button
            type="button"
            className="secondary"
            onClick={() => dialogRef.current?.close()}
          >
            ✕
          </button>
        </div>

        {step === "form" ? (
          <div className="modal-body">
            <label>
              First session date
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </label>
            <label>
              Check-in opens at
              <input
                type="time"
                value={checkinOpenTime}
                onChange={(e) => setCheckinOpenTime(e.target.value)}
                required
              />
            </label>
            <label>
              Check-in closes at
              <input
                type="time"
                value={checkinCloseTime}
                onChange={(e) => setCheckinCloseTime(e.target.value)}
                required
              />
            </label>
            <label>
              Repeat every (days)
              <input
                type="number"
                min={1}
                max={90}
                value={intervalDays}
                onChange={(e) => setIntervalDays(Math.max(1, Number(e.target.value)))}
              />
            </label>
            <label>
              Number of sessions
              <input
                type="number"
                min={1}
                max={52}
                value={repeatCount}
                onChange={(e) => setRepeatCount(Math.max(1, Math.min(52, Number(e.target.value))))}
              />
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={generateOccurrences}
                disabled={!startDate || !checkinOpenTime || !checkinCloseTime}
              >
                Preview sessions
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => dialogRef.current?.close()}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <form
            action={action}
            className="modal-body"
            onSubmit={() => dialogRef.current?.close()}
          >
            <input type="hidden" name="seriesId" value={seriesId} />
            <input type="hidden" name="timezoneOffset" value={String(timezoneOffset)} />
            <p style={{ color: "var(--muted)", margin: 0 }}>
              {activeOccurrences.length} of {occurrences.length} sessions will be
              created. Click a session to cancel or restore it.
            </p>
            <div style={{ display: "grid", gap: 6, maxHeight: 320, overflowY: "auto" }}>
              {occurrences.map((item, index) => (
                <input
                  key={index}
                  type="hidden"
                  name={item.removed ? undefined : "occurrences"}
                  value={`${item.checkinOpen}|${item.checkinClose}`}
                  disabled={item.removed}
                />
              ))}
              {occurrences.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  className={item.removed ? "secondary danger" : "secondary"}
                  onClick={() => toggleOccurrence(index)}
                  style={{
                    textAlign: "left",
                    opacity: item.removed ? 0.5 : 1,
                    textDecoration: item.removed ? "line-through" : "none"
                  }}
                >
                  {formatPreviewDate(item.date)} &middot;{" "}
                  {item.checkinOpen.slice(11)} - {item.checkinClose.slice(11)}
                  {item.removed ? " (cancelled)" : ""}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="submit" disabled={activeOccurrences.length === 0}>
                Create {activeOccurrences.length} session{activeOccurrences.length !== 1 ? "s" : ""}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setStep("form")}
              >
                Back
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => dialogRef.current?.close()}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
