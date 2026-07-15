"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { api, CATEGORIES, type Category } from "@/lib/api";
import { useActiveBusiness } from "@/lib/activeBusiness";

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

export default function AdminPage() {
  const { user } = useUser();
  const { businesses, refreshBusinesses, setActiveBusinessId } = useActiveBusiness();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("photography");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState("13.0827");
  const [lng, setLng] = useState("80.2707");
  const [city, setCity] = useState("chennai");
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
        name,
        category,
        description,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        city,
        address,
        instagram_handle: instagram,
      });
      setStatus("done");
      refreshBusinesses();
      setActiveBusinessId(created.id);
      setName("");
      setDescription("");
      setAddress("");
      setInstagram("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to create business");
    }
  };

  return (
    <main className="min-h-screen px-6 py-12 md:px-16 max-w-4xl mx-auto">
      <header className="mb-10">
        <p className="font-mono text-xs uppercase tracking-widest text-moss mb-2">Threadwork</p>
        <h1 className="font-display text-4xl leading-tight">Admin</h1>
        <p className="text-ink-light mt-2">
          Create business profiles and manage verification, without going through the backend&apos;s
          Swagger docs.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-12">
      <div>
      <h2 className="font-mono text-xs uppercase tracking-widest text-ink-light mb-4">
        Add a business
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="text-xs font-mono uppercase tracking-widest text-ink-light">
          Signed in as {user?.primaryEmailAddress?.emailAddress ?? "…"}
        </p>

        <Field label="Business name">
          <input required value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </Field>

        <Field label="Category">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="input"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="input"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Latitude">
            <input
              required
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="input"
              inputMode="decimal"
            />
          </Field>
          <Field label="Longitude">
            <input
              required
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="input"
              inputMode="decimal"
            />
          </Field>
        </div>

        <Field label="City">
          <input value={city} onChange={(e) => setCity(e.target.value)} className="input" />
        </Field>

        <Field label="Address">
          <input value={address} onChange={(e) => setAddress(e.target.value)} className="input" />
        </Field>

        <Field label="Instagram handle">
          <input value={instagram} onChange={(e) => setInstagram(e.target.value)} className="input" />
        </Field>

        <button
          type="submit"
          disabled={status === "saving"}
          className="w-full py-2.5 rounded-md bg-ink text-cream font-mono text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50"
        >
          {status === "saving" ? "Creating…" : "Create business"}
        </button>

        {status === "done" && (
          <p className="text-sm text-moss">Created — set as your active business. Try the Search page.</p>
        )}
        {status === "error" && <p className="text-sm text-terracotta-dark">{error}</p>}
      </form>
      </div>

      <div>
        <h2 className="font-mono text-xs uppercase tracking-widest text-ink-light mb-4">
          Manage businesses ({businesses.length})
        </h2>
        <div className="space-y-2">
          {businesses.map((b) => (
            <BusinessRow key={b.id} business={b} onChange={refreshBusinesses} />
          ))}
          {businesses.length === 0 && (
            <p className="text-sm text-ink-light">No businesses yet.</p>
          )}
        </div>
      </div>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid rgba(34, 32, 29, 0.2);
          border-radius: 6px;
          padding: 0.5rem 0.75rem;
          background: transparent;
          font-size: 0.875rem;
        }
      `}</style>
    </main>
  );
}

function BusinessRow({
  business,
  onChange,
}: {
  business: { id: string; name: string; category: string; is_verified: boolean };
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);

  const toggleVerify = async () => {
    setBusy(true);
    try {
      await api.verifyBusiness(business.id, !business.is_verified);
      onChange();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete "${business.name}"? This can't be undone.`)) return;
    setBusy(true);
    try {
      await api.deleteBusiness(business.id);
      onChange();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-paper border border-line rounded-lg p-3 flex items-center justify-between gap-2">
      <div>
        <p className="text-sm font-medium">{business.name}</p>
        <p className="text-xs font-mono text-ink-light uppercase tracking-wide">
          {business.category.replace("_", " ")} ·{" "}
          <span className={business.is_verified ? "text-moss" : "text-terracotta-dark"}>
            {business.is_verified ? "Verified" : "Pending"}
          </span>
        </p>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button
          onClick={toggleVerify}
          disabled={busy}
          className="text-[11px] font-mono uppercase tracking-widest px-2 py-1 rounded-md border border-line hover:border-ink/40 disabled:opacity-50"
        >
          {business.is_verified ? "Unverify" : "Verify"}
        </button>
        <button
          onClick={remove}
          disabled={busy}
          className="text-[11px] font-mono uppercase tracking-widest px-2 py-1 rounded-md border border-terracotta text-terracotta-dark hover:bg-terracotta hover:text-cream disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-mono uppercase tracking-widest text-ink-light mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}