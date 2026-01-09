import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";

export default async function HomePage() {
  const user = await getSessionUser();
  if (user?.email) {
    redirect("/admin");
  }
  redirect("/login");

  return null;
}
