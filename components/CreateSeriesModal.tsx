"use client";

import { useEffect, useRef, useState } from "react";

type CreateSeriesModalProps = {
  action: (formData: FormData) => void;
  openOnLoad?: boolean;
};

export default function CreateSeriesModal({
  action,
  openOnLoad
}: CreateSeriesModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [errors, setErrors] = useState<{ name?: string; startDate?: string }>(
    {}
  );

  useEffect(() => {
    if (openOnLoad) {
      dialogRef.current?.showModal();
    }
  }, [openOnLoad]);

  const validate = () => {
    const next: { name?: string; startDate?: string } = {};
    const trimmed = name.trim();
    if (!trimmed) {
      next.name = "Name is required.";
    } else if (trimmed.length < 2) {
      next.name = "Name must be at least 2 characters.";
    } else if (trimmed.length > 100) {
      next.name = "Name must be under 100 characters.";
    }
    if (!startDate) {
      next.startDate = "Start date is required.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (!validate()) {
      event.preventDefault();
      return;
    }
    dialogRef.current?.close();
  };

  const handleOpen = () => {
    setName("");
    setStartDate("");
    setErrors({});
    dialogRef.current?.showModal();
  };

  return (
    <>
      <button type="button" onClick={handleOpen}>
        + Create series
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
          onSubmit={handleSubmit}
          noValidate
        >
          <label>
            Series name
            <input
              name="name"
              placeholder="e.g. The Prophet Series"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
            />
            {errors.name && (
              <span className="field-error">{errors.name}</span>
            )}
          </label>
          <label>
            Start date
            <input
              type="date"
              name="startDate"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value);
                if (errors.startDate)
                  setErrors((prev) => ({ ...prev, startDate: undefined }));
              }}
            />
            {errors.startDate && (
              <span className="field-error">{errors.startDate}</span>
            )}
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              name="isActive"
              style={{ width: "auto" }}
              defaultChecked
            />
            Mark as active immediately
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
