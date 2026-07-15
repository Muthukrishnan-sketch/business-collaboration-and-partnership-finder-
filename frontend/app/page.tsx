"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { api, type MatchCandidate } from "@/lib/api";
import { MatchCard } from "@/components/MatchCard";
import { useActiveBusiness } from "@/lib/activeBusiness";

// Leaflet needs `window`, so it can't render on the server — load it client-only.
const MatchMap = dynamic(() => import("@/components/MatchMap").then((m) => m.MatchMap), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-line bg-cream-dim animate-pulse" style={{ height: 360 }} />
  ),
});

export default function SearchPage() {
  const { activeBusiness, activeBusinessId } = useActiveBusiness();
  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeBusinessId) {
      setMatches([]);
      return;
    }
    setLoading(true);
    setError(null);
    api
      .getMatches(activeBusinessId)
      .then(setMatches)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [activeBusinessId]);

  return (
    <main className="min-h-screen px-6 py-12 md:px-16 max-w-4xl mx-auto">
      <header className="mb-10">
        <p className="font-mono text-xs uppercase tracking-widest text-moss mb-2">Threadwork</p>
        <h1 className="font-display text-4xl md:text-5xl leading-tight">
          Find the partners your business is missing.
        </h1>
        <p className="text-ink-light mt-4 max-w-xl">
          Pick your business from the &ldquo;Acting as&rdquo; menu above, and Threadwork scores
          nearby businesses on category fit, proximity, ratings, and social reach.
        </p>
      </header>

      {!activeBusinessId && (
        <p className="text-sm text-ink-light border border-dashed border-ink/20 rounded-lg p-6">
          Select a business from the &ldquo;Acting as&rdquo; menu at the top of the page to see its
          recommended partners. No businesses yet? Create one on the{" "}
          <a href="/admin" className="text-terracotta underline">
            Admin
          </a>{" "}
          page.
        </p>
      )}

      {activeBusinessId && (
        <>
          <h2 className="font-mono text-xs uppercase tracking-widest text-ink-light mb-3">
            {activeBusiness ? `Matches for ${activeBusiness.name}` : "Loading…"}
          </h2>

          {loading && <p className="text-sm text-ink-light">Finding matches…</p>}
          {error && <p className="text-sm text-terracotta-dark">{error}</p>}
          {!loading && !error && matches.length === 0 && (
            <p className="text-sm text-ink-light">
              No matches found nearby yet — try adding more businesses in different categories on
              the Admin page.
            </p>
          )}

          {!loading && !error && activeBusiness && (
            <div className="mb-6">
              <MatchMap center={activeBusiness} matches={matches} />
            </div>
          )}

          <div className="space-y-3">
            {matches.map((m) => (
              <MatchCard
                key={m.business.id}
                match={m}
                onConnect={
                  activeBusinessId
                    ? () => api.sendConnectionRequest(activeBusinessId, m.business.id).then(() => {})
                    : undefined
                }
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}