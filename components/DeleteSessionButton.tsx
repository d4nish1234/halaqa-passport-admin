"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteSessionButton({
  sessionId
}: {
  sessionId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Delete this session and all related attendance? This cannot be undone."
    );
    if (!confirmed) return;
    setLoading(true);
    const response = await fetch(`/api/sessions/${sessionId}`, {
      method: "DELETE"
    });
    setLoading(false);

    if (response.ok) {
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      className="secondary danger"
      onClick={handleDelete}
      disabled={loading}
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
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}
