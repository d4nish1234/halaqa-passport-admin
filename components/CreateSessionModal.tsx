"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  const [checkinOpenAt, setCheckinOpenAt] = useState("");
  const [checkinCloseAt, setCheckinCloseAt] = useState("");
  const [errors, setErrors] = useState<{
    checkinOpenAt?: string;
    checkinCloseAt?: string;
  }>({});

  useEffect(() => {
    if (openOnLoad && !disabled) {
      dialogRef.current?.showModal();
    }
  }, [openOnLoad, disabled]);

  const validate = () => {
    const next: { checkinOpenAt?: string; checkinCloseAt?: string } = {};
    if (!checkinOpenAt) {
      next.checkinOpenAt = "Check-in open time is required.";
    }
    if (!checkinCloseAt) {
      next.checkinCloseAt = "Check-in close time is required.";
    }
    if (checkinOpenAt && checkinCloseAt && checkinCloseAt <= checkinOpenAt) {
      next.checkinCloseAt = "Close time must be after open time.";
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
    setCheckinOpenAt("");
    setCheckinCloseAt("");
    setErrors({});
    dialogRef.current?.showModal();
  };

  return (
    <>
      <button
        type="button"
        className="secondary"
        disabled={disabled}
        onClick={handleOpen}
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
          onSubmit={handleSubmit}
          noValidate
        >
          {seriesId ? (
            <input type="hidden" name="seriesId" value={seriesId} />
          ) : null}
          <input type="hidden" name="timezoneOffset" value={timezoneOffset} />
          <label>
            Check-in opens
            <input
              type="datetime-local"
              name="checkinOpenAt"
              value={checkinOpenAt}
              onChange={(event) => {
                setCheckinOpenAt(event.target.value);
                if (errors.checkinOpenAt)
                  setErrors((prev) => ({ ...prev, checkinOpenAt: undefined }));
              }}
            />
            {errors.checkinOpenAt && (
              <span className="field-error">{errors.checkinOpenAt}</span>
            )}
          </label>
          <label>
            Check-in closes
            <input
              type="datetime-local"
              name="checkinCloseAt"
              value={checkinCloseAt}
              onChange={(event) => {
                setCheckinCloseAt(event.target.value);
                if (errors.checkinCloseAt)
                  setErrors((prev) => ({ ...prev, checkinCloseAt: undefined }));
              }}
            />
            {errors.checkinCloseAt && (
              <span className="field-error">{errors.checkinCloseAt}</span>
            )}
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
