"use client";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebase/client";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (provider: GoogleAuthProvider) => {
    setError(null);
    setLoading(true);
    try {
      if (provider instanceof GoogleAuthProvider) {
        provider.setCustomParameters({ prompt: "select_account" });
      }
      const auth = getFirebaseAuth();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "Unable to start session.");
      }

      router.push("/admin");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed.";
      setError(message);
      setLoading(false);
    } finally {
      // Keep the spinner active while the redirect completes.
    }
  };

  return (
    <>
      <header>
        <h1>Halaqa Passport Admin</h1>
      </header>
      <main>
        <section className="card" style={{ maxWidth: 480 }}>
          <h2>Welcome to Halaqa Passport</h2>
          <p>You’re almost ready to get started.</p>
          <p>
            Sign in to access your admin dashboard, where you can create
            programs, set up sessions, and display QR codes for participants to
            check in.
          </p>
          <p>
            This admin portal is free to use and intended for program organizers
            and volunteers.
          </p>
          <h3 style={{ marginTop: 16 }}>Sign in</h3>
          <p>Use your Google account to sign in.</p>
          <button
            onClick={() => handleSignIn(new GoogleAuthProvider())}
            disabled={loading}
            className={loading ? "loading" : undefined}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <span className="button-spinner" aria-hidden="true" />
                <span>Signing in...</span>
              </>
            ) : (
              "Sign in with Google"
            )}
          </button>
          {error && (
            <p className="field-error" style={{ marginTop: 12 }}>{error}</p>
          )}
        </section>
      </main>
    </>
  );
}
