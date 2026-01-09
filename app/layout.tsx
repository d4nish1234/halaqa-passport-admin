import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Halaqa Passport Admin",
  description: "Admin console for Halaqa Passport"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <footer>
          © 2026 Young Momins |{" "}
          <a href="https://youngmomins.com" target="_blank" rel="noreferrer">
            Youngmomins.com
          </a>
          {" "}
          | contact:{" "}
          <a href="mailto:info@youngmomins.com">info@youngmomins.com</a>
          {" "}
          | Free for community use
        </footer>
      </body>
    </html>
  );
}
