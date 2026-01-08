"use client";

import { useState } from "react";

type RewardsFormProps = {
  seriesId: string;
  initialRewards: number[];
  action: (formData: FormData) => void;
};

export default function RewardsForm({
  seriesId,
  initialRewards,
  action
}: RewardsFormProps) {
  const [thresholds, setThresholds] = useState<string[]>(
    initialRewards.length > 0
      ? initialRewards.map((value) => String(value))
      : [""]
  );

  const handleChange = (index: number, value: string) => {
    setThresholds((prev) =>
      prev.map((item, idx) => (idx === index ? value : item))
    );
  };

  const handleAdd = () => {
    setThresholds((prev) => [...prev, ""]);
  };

  const handleRemove = (index: number) => {
    setThresholds((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <form action={action}>
      <input type="hidden" name="seriesId" value={seriesId} />
      <div style={{ display: "grid", gap: 12 }}>
        {thresholds.map((value, index) => (
          <div
            key={`reward-${index}`}
            style={{ display: "flex", gap: 8, alignItems: "center" }}
          >
            <input
              type="number"
              name="thresholds"
              min={1}
              step={1}
              placeholder="Check-ins required"
              value={value}
              onChange={(event) => handleChange(index, event.target.value)}
              required={index === 0}
            />
            <button
              type="button"
              className="secondary danger"
              onClick={() => handleRemove(index)}
              disabled={thresholds.length <= 1}
            >
              <span className="button-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="M6 6l1 14h10l1-14" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                </svg>
              </span>
              Remove
            </button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="secondary" onClick={handleAdd}>
            Add reward
          </button>
          <button type="submit">Save rewards</button>
        </div>
      </div>
    </form>
  );
}
