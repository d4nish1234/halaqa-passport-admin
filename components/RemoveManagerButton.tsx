"use client";

import { useRef } from "react";

type RemoveManagerButtonProps = {
  email: string;
  action: (formData: FormData) => void;
  seriesId: string;
};

export default function RemoveManagerButton({
  email,
  action,
  seriesId
}: RemoveManagerButtonProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleClick = () => {
    const confirmed = window.confirm(
      `Remove ${email} as a manager? They will lose access to this series.`
    );
    if (!confirmed) return;
    formRef.current?.requestSubmit();
  };

  return (
    <form ref={formRef} action={action}>
      <input type="hidden" name="seriesId" value={seriesId} />
      <input type="hidden" name="email" value={email} />
      <button
        type="button"
        className="secondary danger"
        style={{ padding: "6px 10px", fontSize: 12 }}
        onClick={handleClick}
      >
        Remove
      </button>
    </form>
  );
}
