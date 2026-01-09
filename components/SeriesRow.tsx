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

  const handleNavigate = () => {
    router.push(href);
  };

  return (
    <tr
      className="table-row-link"
      role="link"
      tabIndex={0}
      onClick={handleNavigate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleNavigate();
        }
      }}
    >
      <td>{name}</td>
      <td>{startDate}</td>
      {createdBy ? <td>{createdBy}</td> : null}
      <td>{status}</td>
    </tr>
  );
}
