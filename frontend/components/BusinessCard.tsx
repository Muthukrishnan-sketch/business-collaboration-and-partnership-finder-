import type { Business } from "@/lib/api";

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

export function BusinessCard({
  business,
  selected,
  onSelect,
}: {
  business: Business;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left border rounded-lg p-4 transition-colors ${
        selected ? "border-terracotta bg-terracotta/5" : "border-ink/10 hover:border-ink/30"
      }`}
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-moss mb-1">
        {CATEGORY_LABELS[business.category] ?? business.category}
      </p>
      <h3 className="font-display text-lg leading-snug">{business.name}</h3>
      {business.description && (
        <p className="text-sm text-ink-light mt-1">{business.description}</p>
      )}
    </button>
  );
}