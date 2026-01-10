"use client";

import { useEffect, useMemo, useRef } from "react";

type CreateSessionModalProps = {
  action: (formData: FormData) => void;
  openOnLoad?: boolean;
  disabled?: boolean;
  seriesId?: string;
};

export default function CreateSessionModal({
  action,
  openOnLoad,
  disabled,
  seriesId
}: CreateSessionModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const timezoneOffset = useMemo(() => String(new Date().getTimezoneOffset()), []);

  useEffect(() => {
    if (openOnLoad && !disabled) {
      dialogRef.current?.showModal();
    }
  }, [openOnLoad, disabled]);

  return (
    <>
      <button
        type="button"
        className="secondary"
        disabled={disabled}
        onClick={() => dialogRef.current?.showModal()}
      >
        + Session
      </button>
      <dialog className="modal" ref={dialogRef}>
        <div className="modal-header">
          <h3>Create session</h3>
          <button
            type="button"
            className="secondary"
            onClick={() => dialogRef.current?.close()}
          >
            ✕
          </button>
        </div>
        <form
          action={action}
          className="modal-body"
          onSubmit={() => dialogRef.current?.close()}
        >
          {seriesId ? (
            <input type="hidden" name="seriesId" value={seriesId} />
          ) : null}
          <input type="hidden" name="timezoneOffset" value={timezoneOffset} />
          <label>
            Session start
            <input type="datetime-local" name="startAt" required />
          </label>
          <label>
            Check-in opens
            <input type="datetime-local" name="checkinOpenAt" required />
          </label>
          <label>
            Check-in closes
            <input type="datetime-local" name="checkinCloseAt" required />
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="submit">Create session</button>
            <button
              type="button"
              className="secondary"
              onClick={() => dialogRef.current?.close()}
            >
              Cancel
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
