"use client";

import { useState } from "react";

type InlineNicknameEditorProps = {
  seriesId: string;
  participantId: string;
  nickname: string | null;
  onUpdated?: (nickname: string) => void;
};

export default function InlineNicknameEditor({
  seriesId,
  participantId,
  nickname,
  onUpdated
}: InlineNicknameEditorProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(nickname ?? "");
  const [saving, setSaving] = useState(false);

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
      onUpdated?.(next);
      setEditing(false);
    }
  };

  if (!editing) {
    return (
      <button
        type="button"
        className="inline-edit-button"
        onClick={() => setEditing(true)}
        aria-label="Edit nickname"
      >
        ✏️
      </button>
    );
  }

  return (
    <div className="inline-edit">
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="inline-edit-input"
      />
      <button type="button" onClick={handleSave} disabled={saving}>
        Save
      </button>
      <button
        type="button"
        className="secondary"
        onClick={() => {
          setValue(nickname ?? "");
          setEditing(false);
        }}
      >
        Cancel
      </button>
    </div>
  );
}
