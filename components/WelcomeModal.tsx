"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "halaqaAdminWelcomeDismissed";

export default function WelcomeModal() {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // Ignore storage errors.
      }
    };

    dialog.addEventListener("close", handleClose);

    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        dialog.showModal();
      }
    } catch {
      dialog.showModal();
    }

    return () => dialog.removeEventListener("close", handleClose);
  }, []);

  const handleDismiss = () => {
    dialogRef.current?.close();
  };

  const handleCreate = () => {
    dialogRef.current?.close();
    router.push("/admin/series?new=1");
  };

  return (
    <dialog
      className="modal modal-help"
      ref={dialogRef}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          handleDismiss();
        }
      }}
    >
      <div className="modal-header">
        <h3>Welcome to Halaqa Passport</h3>
        <button type="button" className="secondary" onClick={handleDismiss}>
          ✕
        </button>
      </div>
      <div className="modal-body">
        <p className="help-intro">
          Track attendance and reward consistent participation in your
          programs with simple QR check-ins.
        </p>

        <div className="help-steps">
          <div className="help-step">
            <div className="help-step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M12 8v8" />
                <path d="M8 12h8" />
              </svg>
            </div>
            <div className="help-step-content">
              <strong>1. Create a Series</strong>
              <p>A series is your program — like &quot;The Prophet Series&quot; or &quot;Akhlaq Series&quot;.</p>
            </div>
          </div>

          <div className="help-step">
            <div className="help-step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4" />
                <path d="M8 2v4" />
                <path d="M3 10h18" />
              </svg>
            </div>
            <div className="help-step-content">
              <strong>2. Add Sessions</strong>
              <p>Each session is a single meeting. A QR code is generated automatically for check-ins.</p>
            </div>
          </div>

          <div className="help-step">
            <div className="help-step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M7 7h.01" />
                <path d="M7 12h.01" />
                <path d="M12 7h.01" />
                <path d="M17 17h.01" />
                <path d="M12 17h.01" />
                <path d="M17 12h.01" />
              </svg>
            </div>
            <div className="help-step-content">
              <strong>3. Show the QR Code</strong>
              <p>Use TV mode to display the QR code on a screen. Participants scan it to check in.</p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" className="secondary" onClick={handleDismiss}>
            Maybe later
          </button>
          <button type="button" onClick={handleCreate}>
            Create your first series
          </button>
        </div>
      </div>
    </dialog>
  );
}
