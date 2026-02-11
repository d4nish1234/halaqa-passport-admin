"use client";

import { useState } from "react";

export default function SessionAttendeeRow({
  seriesId,
  participantId,
  nickname,
  timestamp
}: {
  seriesId: string;
  participantId: string;
  nickname: string | null;
  timestamp: string | null;
}) {
  const [currentNickname, setCurrentNickname] = useState(nickname ?? "");
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentNickname);
  const [saving, setSaving] = useState(false);
  const suffix = participantId.slice(-4);
  const label = currentNickname
    ? `${currentNickname} (${suffix})`
    : `Participant (${suffix})`;

  const handleSave = async () => {
    const next = value.trim();
    if (!next) return;
    setSaving(true);
    const response = await fetch(
      `/api/series/${seriesId}/participants/${participantId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: next })
      }
    );
    setSaving(false);
    if (response.ok) {
      setCurrentNickname(next);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <div className="attendee-card editing">
        <div className="inline-edit-row">
          <input
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            style={{ flex: 1 }}
          />
          <button type="button" onClick={handleSave} disabled={saving}>
            Save
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setValue(currentNickname);
              setEditing(false);
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="attendee-card">
      <div className="attendee-card-avatar">
        {(currentNickname || "P").charAt(0).toUpperCase()}
      </div>
      <div className="attendee-card-info">
        <div className="attendee-card-name">{label}</div>
        <div className="attendee-card-meta">
          {timestamp
            ? `Checked in ${new Date(timestamp).toLocaleString("en-US")}`
            : "No timestamp"}
        </div>
      </div>
      <button
        type="button"
        className="secondary"
        onClick={() => setEditing(true)}
        aria-label="Edit nickname"
        style={{ padding: "6px 12px", fontSize: 13 }}
      >
        Edit
      </button>
    </div>
  );
}
