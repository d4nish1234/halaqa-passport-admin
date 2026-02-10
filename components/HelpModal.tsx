"use client";

import { useRef } from "react";

export default function HelpModal() {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const handleDismiss = () => {
    dialogRef.current?.close();
  };

  return (
    <>
      <button
        type="button"
        className="help-button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label="Open help"
      >
        ?
      </button>
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
          <h3>Getting started</h3>
          <button type="button" className="secondary" onClick={handleDismiss}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <p className="help-intro">
            Halaqa Passport helps you encourage consistent participation in your
            program through simple QR check-ins, progress tracking, and rewards.
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
                <strong>Create a Series</strong>
                <p>A series represents your overall program — like &quot;The Prophet Series&quot; or &quot;Akhlaq Series&quot;.</p>
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
                <strong>Schedule Sessions</strong>
                <p>Each session is a single meeting. Set check-in open/close times — a QR code is generated automatically.</p>
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
                <strong>Display the QR Code</strong>
                <p>Use TV mode to show the QR code on a screen. Participants scan it with the Halaqa Passport app to check in.</p>
              </div>
            </div>

            <div className="help-step">
              <div className="help-step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                  <path d="M12 20v-6" />
                  <path d="M6 20v-4" />
                  <path d="M18 20V10" />
                  <path d="M6 14l6-6 6 6" />
                </svg>
              </div>
              <div className="help-step-content">
                <strong>Track &amp; Reward</strong>
                <p>View attendance, track leaderboards, and set up reward thresholds to keep participants motivated.</p>
              </div>
            </div>
          </div>

          <div className="help-tip">
            <strong>Tip:</strong> Use &quot;+ Recurring sessions&quot; to quickly schedule a whole term of weekly sessions at once.
          </div>
        </div>
      </dialog>
    </>
  );
}
