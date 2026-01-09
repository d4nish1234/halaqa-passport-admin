"use client";

import { useEffect, useRef } from "react";

type EditSeriesModalProps = {
  action: (formData: FormData) => void;
  seriesId: string;
  name: string;
  startDateValue: string;
  isActive: boolean;
  completed: boolean;
};

export default function EditSeriesModal({
  action,
  seriesId,
  name,
  startDateValue,
  isActive,
  completed
}: EditSeriesModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    if (!startDateValue) {
      dialogRef.current?.close();
    }
  }, [startDateValue]);

  return (
    <>
      <button
        type="button"
        className="secondary"
        onClick={() => dialogRef.current?.showModal()}
      >
        Edit
      </button>
      <dialog className="modal" ref={dialogRef}>
        <div className="modal-header">
          <h3>Edit series</h3>
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
          <input type="hidden" name="seriesId" value={seriesId} />
          <label>
            Name
            <input
              type="text"
              name="name"
              defaultValue={name}
              disabled={!isActive}
              required={isActive}
            />
          </label>
          <label>
            Start date
            <input
              type="date"
              name="startDate"
              defaultValue={startDateValue}
              disabled={!isActive}
              required={isActive}
            />
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={isActive}
              style={{ width: "auto" }}
            />
            Active
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              name="completed"
              defaultChecked={completed}
              style={{ width: "auto" }}
            />
            Completed
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="submit">Save changes</button>
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
