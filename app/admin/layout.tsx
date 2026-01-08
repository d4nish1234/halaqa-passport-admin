import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import AccountMenu from "@/components/AccountMenu";

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
          <AccountMenu email={user.email ?? ""} />
        </nav>
      </header>
      <main>
        {children}
      </main>
    </>
  );
}
