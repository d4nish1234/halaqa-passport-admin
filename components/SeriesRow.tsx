"use client";

import { useRouter } from "next/navigation";

type SeriesRowProps = {
  href: string;
  name: string;
  startDate: string;
  status: string;
  createdBy?: string | null;
};

export default function SeriesRow({
  href,
  name,
  startDate,
  status,
  createdBy
}: SeriesRowProps) {
  const router = useRouter();

  const badgeClass =
    status === "Completed"
      ? "badge closed"
      : status === "Inactive"
      ? "badge upcoming"
      : "badge";

  return (
    <div
      className="series-card"
      role="link"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(href);
        }
      }}
    >
      <div className="series-card-info">
        <div className="series-card-name">{name}</div>
        <div className="series-card-meta">
          {createdBy ? `${createdBy} · ` : ""}
          Started {startDate}
        </div>
      </div>
      <div className="series-card-status">
        <span className={badgeClass}>{status}</span>
      </div>
      <div className="series-card-arrow" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 3l5 5-5 5" />
        </svg>
      </div>
    </div>
  );
}
