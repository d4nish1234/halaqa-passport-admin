export default function AttendanceExportLink({
  seriesId,
  label = "Export CSV",
  className
}: {
  seriesId: string;
  label?: string;
  className?: string;
}) {
  return (
    <a
      href={`/api/series/${seriesId}/attendance.csv`}
      className={className}
    >
      {label}
    </a>
  );
}
