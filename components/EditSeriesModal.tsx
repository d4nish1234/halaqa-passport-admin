"use client";

import { useRef, useState } from "react";

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
  name: initialName,
  startDateValue,
  isActive: initialIsActive,
  completed: initialCompleted
}: EditSeriesModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [name, setName] = useState(initialName);
  const [startDate, setStartDate] = useState(startDateValue);
  const [isActive, setIsActive] = useState(initialIsActive);
  const [completed, setCompleted] = useState(initialCompleted);
  const [errors, setErrors] = useState<{
    name?: string;
    startDate?: string;
  }>({});

  const validate = () => {
    const next: { name?: string; startDate?: string } = {};
    const trimmed = name.trim();
    if (isActive) {
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
    setName(initialName);
    setStartDate(startDateValue);
    setIsActive(initialIsActive);
    setCompleted(initialCompleted);
    setErrors({});
    dialogRef.current?.showModal();
  };

  return (
    <>
      <button
        type="button"
        className="secondary"
        onClick={handleOpen}
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
          onSubmit={handleSubmit}
          noValidate
        >
          <input type="hidden" name="seriesId" value={seriesId} />
          <label>
            Name
            <input
              type="text"
              name="name"
              value={name}
              disabled={!isActive}
              onChange={(event) => {
                setName(event.target.value);
                if (errors.name)
                  setErrors((prev) => ({ ...prev, name: undefined }));
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
              disabled={!isActive}
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
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              style={{ width: "auto" }}
            />
            Active
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              name="completed"
              checked={completed}
              onChange={(event) => setCompleted(event.target.checked)}
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
