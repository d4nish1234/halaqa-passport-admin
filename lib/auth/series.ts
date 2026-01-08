import type { Series } from "@/lib/data/types";

export function canManageSeries(params: {
  email: string;
  series: Series;
  isAdmin: boolean;
}) {
  if (params.isAdmin) return true;
  const email = params.email.toLowerCase();
  if (params.series.createdBy.toLowerCase() === email) return true;
  const managers = (params.series.managers ?? []).map((manager) =>
    manager.toLowerCase()
  );
  return managers.includes(email);
}
