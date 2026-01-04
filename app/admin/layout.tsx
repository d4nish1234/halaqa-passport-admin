import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import SignOutButton from "@/components/SignOutButton";

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <header>
        <h1>Halaqa Passport Admin</h1>
        <nav>
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/series">Series</Link>
          <SignOutButton />
        </nav>
      </header>
      <main>{children}</main>
    </>
  );
}
