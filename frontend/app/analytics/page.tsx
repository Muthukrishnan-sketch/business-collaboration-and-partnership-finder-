"use client";

import { useEffect, useState } from "react";
import { api, type AnalyticsSummary } from "@/lib/api";
import { categoryColor, categoryLabel } from "@/lib/categoryStyles";

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
            <StatCard label="Businesses" value={data.total_businesses} color="#C75D3A" />
            <StatCard label="Verified" value={data.verified_businesses} color="#5C6B4F" />
            <StatCard label="Connections" value={data.total_connections} color="#3B82F6" />
            <StatCard label="Proposals" value={data.total_proposals_generated} color="#B68A3A" />
          </div>

          <section className="bg-paper border border-line rounded-xl p-5">
            <h2 className="font-mono text-xs uppercase tracking-widest text-ink-light mb-4">
              Businesses by category
            </h2>
            <BarList
              data={data.businesses_by_category}
              total={data.total_businesses}
              colorFor={(k) => categoryColor(k)}
              labelFor={(k) => categoryLabel(k)}
            />
          </section>

          <section className="bg-paper border border-line rounded-xl p-5">
            <h2 className="font-mono text-xs uppercase tracking-widest text-ink-light mb-4">
              Connections by status
            </h2>
            <BarList
              data={data.connections_by_status}
              total={data.total_connections}
              colorFor={() => "#C75D3A"}
              labelFor={(k) => k.charAt(0).toUpperCase() + k.slice(1)}
            />
          </section>
        </div>
      )}
    </main>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-paper border border-line rounded-xl p-4 transition-all hover:shadow-lg hover:-translate-y-1">
      <div className="font-display text-3xl" style={{ color }}>{value}</div>
      <div className="text-xs font-mono uppercase tracking-widest text-ink-light mt-1">{label}</div>
    </div>
  );
}

function BarList({
  data,
  total,
  colorFor,
  labelFor,
}: {
  data: Record<string, number>;
  total: number;
  colorFor: (key: string) => string;
  labelFor: (key: string) => string;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return <p className="text-sm text-ink-light">No data yet.</p>;

  return (
    <div className="space-y-3">
      {entries.map(([key, count]) => (
        <div key={key} className="flex items-center gap-3">
          <span
            className="text-[11px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full text-white w-32 shrink-0 text-center truncate"
            style={{ background: colorFor(key) }}
          >
            {labelFor(key)}
          </span>
          <div className="flex-1 bg-cream-dim rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${total > 0 ? (count / total) * 100 : 0}%`, background: colorFor(key) }}
            />
          </div>
          <span className="text-xs font-mono text-ink-light w-6 text-right">{count}</span>
        </div>
      ))}
    </div>
  );
}