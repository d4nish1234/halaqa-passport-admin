"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

export default function SignOutButton({
  className,
  label
}: {
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    await Promise.allSettled([
      signOut(getFirebaseAuth()),
      fetch("/api/session", { method: "DELETE" })
    ]);
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className={className ?? "secondary"}
      disabled={loading}
    >
      {loading ? "Signing out..." : label ?? "Sign out"}
    </button>
  );
}
