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
      className="modal"
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
        <p>
          Halaqa Passport helps you encourage consistent participation in your
          program through simple QR check-ins, progress tracking, and rewards.
        </p>
        <h4>How it works</h4>
        <ul>
          <li>
            A Series represents your overall program (for example, The Prophet
            series or The Sahabah series, or Akhlaq series etc).
          </li>
          <li>
            Each Session is an individual meeting where participants check in
            using a QR code.
          </li>
        </ul>
        <p>
          Create a session to generate a QR code for participants to scan at
          the start of your program.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="button" onClick={handleCreate}>
            Create session
          </button>
        </div>
      </div>
    </dialog>
  );
}
