"use client";

import { useState } from "react";
import type { MatchCandidate } from "@/lib/api";

const CATEGORY_LABELS: Record<string, string> = {
  photography: "Photography", videography: "Videography", catering: "Catering",
  decor: "Decor", makeup_artist: "Makeup Artist", venue: "Venue", florist: "Florist",
  gym: "Gym", nutritionist: "Nutritionist", physiotherapist: "Physiotherapist",
  event_planner: "Event Planner", dj_music: "DJ / Music", bakery: "Bakery",
  salon: "Salon", other: "Other",
};

export function MatchCard({
  match,
  onConnect,
}: {
  match: MatchCandidate;
  onConnect?: () => Promise<void>;
}) {
  const score = Math.round(match.overall_score);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [hovered, setHovered] = useState(false);

  const handleConnect = async () => {
    if (!onConnect) return;
    setStatus("sending");
    try {
      await onConnect();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group bg-paper border border-line rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
    >
      {/* "Poster" band — stands in for an image, colored by category, with
          rating badge top-right, matching the reference site's card header */}
      <div
        className="relative h-24 flex items-end p-4"
        style={{
          background: `linear-gradient(135deg, ${categoryColor(match.business.category)}22, ${categoryColor(match.business.category)}0a)`,
        }}
      >
        <div
          className="absolute top-3 right-3 flex items-center gap-1 bg-paper/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs font-mono font-semibold"
          style={{ color: scoreColor(score) }}
        >
          ★ {score}
        </div>
        <span
          className="text-[11px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full text-white"
          style={{ background: categoryColor(match.business.category) }}
        >
          {CATEGORY_LABELS[match.business.category] ?? match.business.category}
        </span>

        {/* Hover-reveal CTA overlay, mirroring the "Watch Now" pattern */}
        {onConnect && (
          <div
            className={`absolute inset-0 flex items-center justify-center bg-ink/70 transition-opacity duration-200 ${
              hovered ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <button
              onClick={handleConnect}
              disabled={status === "sending" || status === "sent"}
              className="text-xs font-mono uppercase tracking-widest px-4 py-2 rounded-full bg-terracotta text-cream hover:opacity-90 disabled:opacity-60"
            >
              {status === "sending" && "Sending…"}
              {status === "sent" && "Request sent ✓"}
              {status === "error" && "Failed — retry"}
              {status === "idle" && "Send request →"}
            </button>
          </div>
        )}
      </div>

      <div className="p-4">
        <h4 className="font-display text-base leading-snug group-hover:text-terracotta transition-colors">
          {match.business.name}
        </h4>

        <div className="flex items-center justify-between mt-1.5 text-xs text-ink-light">
          <div className="flex items-center gap-3">
            {match.business.avg_rating > 0 && (
              <span>⭐ {match.business.avg_rating.toFixed(1)}</span>
            )}
            {typeof match.distance_km === "number" && <span>📍 {match.distance_km} km</span>}
          </div>
        </div>

        {match.reasoning_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {match.reasoning_tags.map((tag, i) => (
              <span
                key={i}
                className="text-[11px] px-2 py-0.5 rounded-full border border-line bg-cream-dim text-ink-light"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function categoryColor(category: string): string {
  const colors: Record<string, string> = {
    photography: "#C75D3A", videography: "#A8481F", catering: "#B68A3A",
    decor: "#5C6B4F", makeup_artist: "#8B5CF6", venue: "#3B82F6",
    florist: "#EC4899", gym: "#0EA5E9", nutritionist: "#10B981",
    physiotherapist: "#14B8A6", event_planner: "#F59E0B", dj_music: "#6366F1",
    bakery: "#D97706", salon: "#DB2777", other: "#6B7280",
  };
  return colors[category] ?? "#6B7280";
}

function scoreColor(score: number): string {
  if (score >= 85) return "#5C6B4F";
  if (score >= 70) return "#B68A3A";
  return "#C75D3A";
}