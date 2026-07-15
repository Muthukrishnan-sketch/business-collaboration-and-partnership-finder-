"use client";

import { useEffect, useState } from "react";
import { api, type AnalyticsSummary } from "@/lib/api";

const CATEGORY_LABELS: Record<string, string> = {
  photography: "Photography",
  videography: "Videography",
  catering: "Catering",
  decor: "Decor",
  makeup_artist: "Makeup Artist",
  venue: "Venue",
  florist: "Florist",
  gym: "Gym",
  nutritionist: "Nutritionist",
  physiotherapist: "Physiotherapist",
  event_planner: "Event Planner",
  dj_music: "DJ / Music",
  bakery: "Bakery",
  salon: "Salon",
  other: "Other",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getAnalyticsSummary().then(setData).catch((err) => setError(err.message));
  }, []);

  return (
    <main className="min-h-screen px-6 py-12 md:px-16 max-w-4xl mx-auto">
      <header className="mb-10">
        <p className="font-mono text-xs uppercase tracking-widest text-moss mb-2">Threadwork</p>
        <h1 className="font-display text-4xl leading-tight">Platform analytics</h1>
      </header>

      {error && <p className="text-sm text-terracotta-dark">{error}</p>}
      {!data && !error && <p className="text-sm text-ink-light">Loading…</p>}

      {data && (
        <div className="space-y-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Businesses" value={data.total_businesses} />
            <StatCard label="Verified" value={data.verified_businesses} />
            <StatCard label="Connections" value={data.total_connections} />
            <StatCard label="Proposals generated" value={data.total_proposals_generated} />
          </div>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-widest text-ink-light mb-3">
              Businesses by category
            </h2>
            <BarList
              data={data.businesses_by_category}
              labelFor={(k) => CATEGORY_LABELS[k] ?? k}
              total={data.total_businesses}
            />
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-widest text-ink-light mb-3">
              Connections by status
            </h2>
            <BarList
              data={data.connections_by_status}
              labelFor={(k) => k.charAt(0).toUpperCase() + k.slice(1)}
              total={data.total_connections}
            />
          </section>
        </div>
      )}
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-paper border border-line rounded-xl p-4">
      <div className="font-display text-3xl">{value}</div>
      <div className="text-xs font-mono uppercase tracking-widest text-ink-light mt-1">{label}</div>
    </div>
  );
}

function BarList({
  data,
  labelFor,
  total,
}: {
  data: Record<string, number>;
  labelFor: (key: string) => string;
  total: number;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    return <p className="text-sm text-ink-light">No data yet.</p>;
  }

  return (
    <div className="space-y-2">
      {entries.map(([key, count]) => (
        <div key={key} className="flex items-center gap-3">
          <span className="text-sm w-32 shrink-0">{labelFor(key)}</span>
          <div className="flex-1 bg-cream-dim rounded-full h-2 overflow-hidden">
            <div
              className="bg-terracotta h-full rounded-full"
              style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs font-mono text-ink-light w-6 text-right">{count}</span>
        </div>
      ))}
    </div>
  );
}