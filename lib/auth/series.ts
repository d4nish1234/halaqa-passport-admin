import type { Series } from "@/lib/data/types";
import { getSeries } from "@/lib/data/series";
import { getSessionUser } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";

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

/**
 * Verify the current user is authenticated and authorized to manage the given series.
 * Returns the user, series, and admin flag, or null if unauthorized.
 */
export async function authorizeForSeries(seriesId: string): Promise<{
  user: { email: string };
  series: Series;
  isAdmin: boolean;
} | null> {
  const [user, series] = await Promise.all([
    getSessionUser(),
    getSeries(seriesId)
  ]);
  if (!user?.email || !series) return null;
  const isAdmin = isAdminEmail(user.email);
  if (!canManageSeries({ email: user.email, series, isAdmin })) return null;
  return { user: { email: user.email }, series, isAdmin };
}
