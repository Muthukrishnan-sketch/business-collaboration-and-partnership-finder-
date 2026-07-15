"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { useActiveBusiness } from "@/lib/activeBusiness";
import { NotificationBell } from "@/components/NotificationBell";
import { SiteMenu } from "@/components/SiteMenu";

const LINKS = [
  { href: "/", label: "Search" },
  { href: "/matches", label: "Matches" },
  { href: "/analytics", label: "Analytics" },
  { href: "/admin", label: "Admin" },
];

export function NavBar() {
  const pathname = usePathname();
  const { businesses, activeBusinessId, setActiveBusinessId } = useActiveBusiness();

  return (
    <header className="border-b border-ink/10">
      <div className="max-w-6xl mx-auto px-6 md:px-16 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <span className="font-mono text-xs uppercase tracking-widest text-moss">Threadwork</span>
          <nav className="flex gap-5">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium ${
                  pathname === link.href ? "text-terracotta" : "text-ink-light hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-mono text-ink-light uppercase tracking-widest">
              Acting as
            </label>
            <select
              value={activeBusinessId ?? ""}
              onChange={(e) => setActiveBusinessId(e.target.value || null)}
              className="text-sm border border-ink/20 rounded-md px-2 py-1 bg-cream"
            >
              <option value="">Select a business…</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <NotificationBell businessId={activeBusinessId} />
          <SiteMenu />

          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-xs font-mono uppercase tracking-widest px-3 py-1.5 rounded-md bg-ink text-cream hover:opacity-90">
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}