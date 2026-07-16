"use client";

import { useState } from "react";
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const businessSelector = (
    <div className="flex items-center gap-2">
      <label className="text-xs font-mono text-ink-light uppercase tracking-widest">
        Acting as
      </label>
      <select
        value={activeBusinessId ?? ""}
        onChange={(e) => setActiveBusinessId(e.target.value || null)}
        className="text-sm border border-line rounded-md px-2 py-1 bg-cream flex-1"
      >
        <option value="">Select a business…</option>
        {businesses.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <header className="border-b border-line">
      <div className="max-w-6xl mx-auto px-4 md:px-16 py-3 md:py-4">
        {/* Top row — always visible */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-8">
            <span className="font-mono text-xs uppercase tracking-widest text-moss">
              Threadwork
            </span>

            {/* Nav links — hidden on mobile, shown from md up */}
            <nav className="hidden md:flex gap-5">
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

          <div className="flex items-center gap-2 md:gap-4">
            {/* Business selector — hidden on mobile, shown from md up */}
            <div className="hidden md:block">{businessSelector}</div>

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

            {/* Hamburger — visible only on mobile */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden text-xl px-1.5"
              aria-label="Menu"
            >
              {mobileOpen ? "×" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile panel — links + business selector, only visible when open, only on mobile */}
        {mobileOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-line space-y-3">
            <nav className="flex flex-col gap-3">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`text-sm font-medium ${
                    pathname === link.href ? "text-terracotta" : "text-ink-light"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            {businessSelector}
          </div>
        )}
      </div>
    </header>
  );
}