"use client";

import { useState } from "react";
import type { MatchCandidate } from "@/lib/api";

export function MatchCard({
  match,
  onConnect,
}: {
  match: MatchCandidate;
  onConnect?: () => Promise<void>;
}) {
  const score = Math.round(match.overall_score);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

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
    <div className="bg-paper border border-line rounded-xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-lg leading-snug">{match.business.name}</div>
          <div className="text-xs font-mono text-ink-light uppercase tracking-wide mt-0.5">
            {match.business.category.replace("_", " ")}
          </div>
        </div>
        <ScoreRing score={score} />
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-ink-light mt-3">
        {match.business.avg_rating > 0 && (
          <span>
            ⭐ {match.business.avg_rating.toFixed(1)} ({match.business.review_count})
          </span>
        )}
        {typeof match.distance_km === "number" && <span>📍 {match.distance_km} km</span>}
      </div>

      {match.reasoning_tags.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-mono uppercase tracking-widest text-ink-light mb-2">
            Why this match
          </p>
          <div className="flex flex-wrap gap-1.5">
            {match.reasoning_tags.map((tag, i) => (
              <span
                key={i}
                className="text-[11.5px] px-2.5 py-1 rounded-full border border-line bg-cream-dim text-ink-light"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {onConnect && (
        <div className="mt-4 pt-3 border-t border-line">
          <button
            onClick={handleConnect}
            disabled={status === "sending" || status === "sent"}
            className="text-xs font-mono uppercase tracking-widest px-3 py-1.5 rounded-md border border-terracotta text-terracotta hover:bg-terracotta hover:text-cream transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-terracotta"
          >
            {status === "sending" && "Sending…"}
            {status === "sent" && "Request sent"}
            {status === "error" && "Failed — retry"}
            {status === "idle" && "Send request"}
          </button>
        </div>
      )}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const color = score >= 85 ? "#5C6B4F" : score >= 70 ? "#B68A3A" : "#C75D3A";

  return (
    <div className="relative w-[54px] h-[54px] shrink-0">
      <svg viewBox="0 0 54 54" className="w-full h-full -rotate-90">
        <circle cx="27" cy="27" r={radius} stroke="#EDE7DA" strokeWidth="5" fill="none" />
        <circle
          cx="27"
          cy="27"
          r={radius}
          stroke={color}
          strokeWidth="5"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-medium">
        {score}
      </span>
    </div>
  );
}