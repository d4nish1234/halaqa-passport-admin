"use client";

import { useEffect, useRef } from "react";

type CreateSeriesModalProps = {
  action: (formData: FormData) => void;
  openOnLoad?: boolean;
};

export default function CreateSeriesModal({
  action,
  openOnLoad
}: CreateSeriesModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    if (openOnLoad) {
      dialogRef.current?.showModal();
    }
  }, [openOnLoad]);

  return (
    <>
      <button
        type="button"
        className="secondary"
        onClick={() => dialogRef.current?.showModal()}
      >
        + Series
      </button>
      <dialog className="modal" ref={dialogRef}>
        <div className="modal-header">
          <h3>Create series</h3>
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
          <label>
            Name
            <input name="name" placeholder="Spring 2025" required />
          </label>
          <label>
            Start date
            <input type="date" name="startDate" required />
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              name="isActive"
              style={{ width: "auto" }}
              defaultChecked
            />
            Active series
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="submit">Create series</button>
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
