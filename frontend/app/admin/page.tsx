"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { api, CATEGORIES, type Category, type Business } from "@/lib/api";
import { useActiveBusiness } from "@/lib/activeBusiness";
import { categoryColor, categoryLabel } from "@/lib/categoryStyles";

export default function AdminPage() {
  const { user } = useUser();
  const { businesses, refreshBusinesses, setActiveBusinessId } = useActiveBusiness();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("photography");
  const [description, setDescription] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [instagram, setInstagram] = useState("");

  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setStatus("saving");
    setError(null);
    try {
      const created = await api.createBusiness(user.id, {
        name, category, description, google_maps_url: googleMapsUrl, city, address, instagram_handle: instagram,
      });
      setStatus("done");
      refreshBusinesses();
      setActiveBusinessId(created.id);
      setName(""); setDescription(""); setGoogleMapsUrl(""); setCity(""); setAddress(""); setInstagram("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to create business");
    }
  };

  return (
    // min-w-0 on the grid + columns below: flex/grid items refuse to shrink
    // below their content's natural width by default, which was pushing
    // this page wider than the phone screen despite overflow-hidden on
    // individual cards. This is the standard fix for that class of bug.
    <main className="min-h-screen px-6 py-12 md:px-16 max-w-4xl mx-auto min-w-0">
      <header className="mb-10">
        <p className="font-mono text-xs uppercase tracking-widest text-moss mb-2">Threadwork</p>
        <h1 className="font-display text-4xl leading-tight">Admin</h1>
        <p className="text-ink-light mt-2">Create business profiles and manage verification.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-12 min-w-0">
        <div className="min-w-0">
          <h2 className="font-mono text-xs uppercase tracking-widest text-ink-light mb-4">Add a business</h2>
          <form onSubmit={handleSubmit} className="space-y-5 bg-paper border border-line rounded-xl p-5 min-w-0">
            <p className="text-xs font-mono uppercase tracking-widest text-ink-light">
              Signed in as {user?.primaryEmailAddress?.emailAddress ?? "…"}
            </p>

            <Field label="Business name">
              <input required value={name} onChange={(e) => setName(e.target.value)} className="input" />
            </Field>

            <Field label="Category">
              <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="input">
                {CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
              </select>
            </Field>

            <Field label="Description">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input" />
            </Field>

            <Field label="Google Maps link">
              <input
                required
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                placeholder="Paste a Google Maps link to this business"
                className="input"
              />
              <p className="text-xs text-ink-light mt-1">
                Open the business on Google Maps → Share → Copy link, then paste it here.
              </p>
            </Field>

            <Field label="City"><input value={city} onChange={(e) => setCity(e.target.value)} className="input" /></Field>
            <Field label="Address"><input value={address} onChange={(e) => setAddress(e.target.value)} className="input" /></Field>
            <Field label="Instagram handle">
              <input value={instagram} onChange={(e) => setInstagram(e.target.value)} className="input" />
            </Field>

            <button
              type="submit"
              disabled={status === "saving"}
              className="w-full py-2.5 rounded-full bg-terracotta text-cream font-mono text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50"
            >
              {status === "saving" ? "Creating…" : "Create business"}
            </button>

            {status === "done" && <p className="text-sm text-moss">Created — set as your active business.</p>}
            {status === "error" && <p className="text-sm text-terracotta-dark">{error}</p>}
          </form>
        </div>

        <div className="min-w-0">
          <h2 className="font-mono text-xs uppercase tracking-widest text-ink-light mb-4">
            Manage businesses ({businesses.length})
          </h2>
          <div className="space-y-3">
            {businesses.map((b) => <BusinessRow key={b.id} business={b} onChange={refreshBusinesses} />)}
            {businesses.length === 0 && <p className="text-sm text-ink-light">No businesses yet.</p>}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid rgb(var(--color-line));
          border-radius: 10px;
          padding: 0.5rem 0.75rem;
          background: rgb(var(--color-paper));
          font-size: 0.875rem;
          transition: border-color 0.15s ease;
        }
        .input:focus {
          outline: none;
          border-color: #C75D3A;
        }
      `}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="block text-xs font-mono uppercase tracking-widest text-ink-light mb-1">{label}</span>
      {children}
    </label>
  );
}

function BusinessRow({ business, onChange }: { business: Business; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const color = categoryColor(business.category);

  const toggleVerify = async () => {
    setBusy(true);
    try { await api.verifyBusiness(business.id, !business.is_verified); onChange(); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!confirm(`Delete "${business.name}"? This can't be undone.`)) return;
    setBusy(true);
    try { await api.deleteBusiness(business.id); onChange(); } finally { setBusy(false); }
  };

  return (
    <div className="bg-paper border border-line rounded-xl overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 min-w-0">
      <div className="h-3" style={{ background: color }} />
      {/* Stacks vertically below sm — name/badges on top, action buttons
          below, instead of squeezing everything into one row that was
          forcing the page wider than the phone screen. */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{business.name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full text-white shrink-0"
              style={{ background: color }}
            >
              {categoryLabel(business.category)}
            </span>
            <span className={`text-[10px] font-mono uppercase tracking-widest shrink-0 ${business.is_verified ? "text-moss" : "text-terracotta-dark"}`}>
              {business.is_verified ? "Verified" : "Pending"}
            </span>
          </div>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button onClick={toggleVerify} disabled={busy} className="text-[11px] font-mono uppercase tracking-widest px-3 py-1 rounded-full border border-line hover:border-ink/40 disabled:opacity-50 whitespace-nowrap">
            {business.is_verified ? "Unverify" : "Verify"}
          </button>
          <button onClick={remove} disabled={busy} className="text-[11px] font-mono uppercase tracking-widest px-3 py-1 rounded-full border border-terracotta text-terracotta-dark hover:bg-terracotta hover:text-cream disabled:opacity-50 whitespace-nowrap">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}