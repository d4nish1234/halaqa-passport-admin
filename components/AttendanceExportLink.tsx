export default function AttendanceExportLink({
  seriesId
}: {
  seriesId: string;
}) {
  return <a href={`/api/series/${seriesId}/attendance.csv`}>Export CSV</a>;
}
