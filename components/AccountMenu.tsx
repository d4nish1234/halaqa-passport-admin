"use client";

import SignOutButton from "@/components/SignOutButton";

import { useEffect, useRef } from "react";

export default function AccountMenu({ email }: { email: string }) {
  const initial = email.trim().charAt(0).toUpperCase() || "A";
  const detailsRef = useRef<HTMLDetailsElement | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!detailsRef.current?.contains(target)) {
        detailsRef.current?.removeAttribute("open");
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <details className="account-menu" ref={detailsRef}>
      <summary className="account-menu-trigger" aria-label="Account menu">
        {initial}
      </summary>
      <div className="account-menu-items">
        <div className="account-menu-email">{email}</div>
        <SignOutButton className="account-menu-item" label="Sign out" />
      </div>
    </details>
  );
}
