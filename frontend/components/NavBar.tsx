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
    <select
      value={activeBusinessId ?? ""}
      onChange={(e) => setActiveBusinessId(e.target.value || null)}
      className="text-sm border border-line rounded-full px-3 py-1.5 bg-cream-dim flex-1"
    >
      <option value="">Select a business…</option>
      {businesses.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name}
        </option>
      ))}
    </select>
  );

  return (
    <header className="border-b border-line bg-paper/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 md:px-16 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-8">
            <span className="font-display text-lg text-terracotta font-medium">Threadwork</span>

            <nav className="hidden md:flex gap-1">
              {LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${
                      isActive
                        ? "bg-terracotta/10 text-terracotta"
                        : "text-ink-light hover:bg-cream-dim hover:text-ink"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden md:block w-48">{businessSelector}</div>

            <NotificationBell businessId={activeBusinessId} />
            <SiteMenu />

            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-xs font-mono uppercase tracking-widest px-4 py-2 rounded-full bg-ink text-cream hover:opacity-90">
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden text-xl px-1.5"
              aria-label="Menu"
            >
              {mobileOpen ? "×" : "☰"}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-line space-y-3">
            <nav className="flex flex-col gap-1">
              {LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`text-sm font-medium px-3 py-2 rounded-full ${
                      isActive ? "bg-terracotta/10 text-terracotta" : "text-ink-light"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            {businessSelector}
          </div>
        )}
      </div>
    </header>
  );
}