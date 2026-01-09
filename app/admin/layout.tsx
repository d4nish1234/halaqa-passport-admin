import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import AccountMenu from "@/components/AccountMenu";
import HelpModal from "@/components/HelpModal";

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
        <h1>
          <Link href="/admin">Halaqa Passport Admin</Link>
        </h1>
        <nav>
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/series">Series</Link>
          <HelpModal />
          <AccountMenu email={user.email ?? ""} />
        </nav>
      </header>
      <main>
        {children}
      </main>
    </>
  );
}
