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
        className="modal"
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            handleDismiss();
          }
        }}
      >
        <div className="modal-header">
          <h3>Help</h3>
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
        </div>
      </dialog>
    </>
  );
}
