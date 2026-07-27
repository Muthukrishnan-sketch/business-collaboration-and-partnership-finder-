export const CATEGORY_COLORS: Record<string, string> = {
  photography: "#C75D3A", videography: "#A8481F", catering: "#B68A3A",
  decor: "#5C6B4F", makeup_artist: "#8B5CF6", venue: "#3B82F6",
  florist: "#EC4899", gym: "#0EA5E9", nutritionist: "#10B981",
  physiotherapist: "#14B8A6", event_planner: "#F59E0B", dj_music: "#6366F1",
  bakery: "#D97706", salon: "#DB2777", other: "#6B7280",
};

export const CATEGORY_LABELS: Record<string, string> = {
  photography: "Photography", videography: "Videography", catering: "Catering",
  decor: "Decor", makeup_artist: "Makeup Artist", venue: "Venue", florist: "Florist",
  gym: "Gym", nutritionist: "Nutritionist", physiotherapist: "Physiotherapist",
  event_planner: "Event Planner", dj_music: "DJ / Music", bakery: "Bakery",
  salon: "Salon", other: "Other",
};

export function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? "#6B7280";
}

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function scoreColor(score: number): string {
  if (score >= 85) return "#5C6B4F";
  if (score >= 70) return "#B68A3A";
  return "#C75D3A";
}