export default function AttendanceExportLink({
  seriesId,
  label = "Export CSV"
}: {
  seriesId: string;
  label?: string;
}) {
  return <a href={`/api/series/${seriesId}/attendance.csv`}>{label}</a>;
}
