import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <header>
        <h1>Halaqa Passport Admin</h1>
        <nav>
          <Link href="/login">Login</Link>
          <Link href="/admin">Admin</Link>
        </nav>
      </header>
      <main>
        <section className="card">
          <h2>Welcome</h2>
          <p>
            Use this console to manage series, sessions, and attendance for the
            Halaqa Passport program.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/login">
              <button>Sign in</button>
            </Link>
            <Link href="/admin">
              <button className="secondary">Go to dashboard</button>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
