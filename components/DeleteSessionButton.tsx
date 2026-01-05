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
      className="secondary"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}
