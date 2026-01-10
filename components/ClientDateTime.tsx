"use client";

export default function ClientDateTime({
  value,
  format
}: {
  value: string;
  format: "date" | "time" | "datetime";
}) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const options: Intl.DateTimeFormatOptions =
    format === "date"
      ? { year: "numeric", month: "short", day: "numeric" }
      : format === "time"
      ? { hour: "2-digit", minute: "2-digit" }
      : { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };

  return <span>{date.toLocaleString("en-US", options)}</span>;
}
