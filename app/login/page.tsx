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
    <div className="login-page">
      <div className="login-container">
        <div className="login-brand">
          <div className="login-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
          </div>
          <h1>Halaqa Passport</h1>
        </div>
        <section className="card login-card">
          <h2>Welcome back</h2>
          <p style={{ color: "var(--muted)" }}>
            Sign in to access your admin dashboard, where you can create
            programs, set up sessions, and display QR codes for participants to
            check in.
          </p>
          <div className="login-features">
            <div className="login-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <path d="M22 4L12 14.01l-3-3" />
              </svg>
              QR check-ins
            </div>
            <div className="login-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <path d="M22 4L12 14.01l-3-3" />
              </svg>
              Progress tracking
            </div>
            <div className="login-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <path d="M22 4L12 14.01l-3-3" />
              </svg>
              Rewards &amp; leaderboards
            </div>
          </div>
          <button
            onClick={() => handleSignIn(new GoogleAuthProvider())}
            disabled={loading}
            className={loading ? "login-button loading" : "login-button"}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <span className="button-spinner" aria-hidden="true" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </>
            )}
          </button>
          {error && (
            <p className="field-error" style={{ marginTop: 12 }}>{error}</p>
          )}
          <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 16, textAlign: "center" }}>
            Free for community use
          </p>
        </section>
      </div>
    </div>
  );
}
