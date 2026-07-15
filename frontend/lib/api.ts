const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
}

export const CATEGORIES = [
  "photography",
  "videography",
  "catering",
  "decor",
  "makeup_artist",
  "venue",
  "florist",
  "gym",
  "nutritionist",
  "physiotherapist",
  "event_planner",
  "dj_music",
  "bakery",
  "salon",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Business = {
  id: string;
  name: string;
  category: string;
  description?: string;
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  instagram_handle?: string;
  website?: string;
  phone?: string;
  avg_rating: number;
  review_count: number;
  is_verified: boolean;
};

export type BusinessCreateInput = {
  name: string;
  category: Category;
  secondary_categories?: Category[];
  description?: string;
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  instagram_handle?: string;
  website?: string;
  phone?: string;
};

export type MatchCandidate = {
  business: Business;
  overall_score: number;
  proximity_score?: number;
  category_fit_score?: number;
  reasoning_tags: string[];
  distance_km?: number;
};

export type Connection = {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: "pending" | "accepted" | "declined" | "blocked";
  message?: string;
  created_at: string;
};

export type Proposal = {
  id: string;
  connection_id: string;
  title: string;
  summary: string;
  terms: {
    referral_structure?: string;
    suggested_bundle?: string;
    next_steps?: string[];
  };
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_business_id: string;
  type: string;
  content: string;
  created_at: string;
};

export type Notification = {
  id: string;
  business_id: string;
  type: string;
  message: string;
  related_connection_id?: string;
  is_read: boolean;
  created_at: string;
};

export type AnalyticsSummary = {
  total_businesses: number;
  verified_businesses: number;
  pending_verification: number;
  businesses_by_category: Record<string, number>;
  total_connections: number;
  connections_by_status: Record<string, number>;
  total_proposals_generated: number;
};

export const api = {
  getMatches: (businessId: string, limit = 10) =>
    request<MatchCandidate[]>(`/matches/${businessId}?limit=${limit}`),

  getBusiness: (businessId: string) => request<Business>(`/businesses/${businessId}`),

  listBusinesses: (params?: { category?: string; city?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<Business[]>(`/businesses${qs ? `?${qs}` : ""}`);
  },

  createBusiness: (ownerUserId: string, data: BusinessCreateInput) =>
    request<Business>(`/businesses?owner_user_id=${encodeURIComponent(ownerUserId)}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  sendConnectionRequest: (requesterId: string, recipientId: string, message?: string) =>
    request<Connection>(`/connections?requester_id=${requesterId}`, {
      method: "POST",
      body: JSON.stringify({ recipient_id: recipientId, message }),
    }),

  getInbox: (businessId: string) => request<Connection[]>(`/connections/inbox/${businessId}`),

  getConnectionsForBusiness: (businessId: string, status?: string) =>
    request<Connection[]>(
      `/connections/for-business/${businessId}${status ? `?status=${status}` : ""}`
    ),

  respondToConnection: (connectionId: string, accept: boolean) =>
    request<Connection>(`/connections/${connectionId}/respond?accept=${accept}`, {
      method: "PATCH",
    }),

  generateProposal: (connectionId: string, context?: string) =>
    request<Proposal>(`/proposals`, {
      method: "POST",
      body: JSON.stringify({ connection_id: connectionId, context }),
    }),

  getMessages: (connectionId: string) => request<Message[]>(`/connections/${connectionId}/messages`),

  sendMessage: (connectionId: string, senderBusinessId: string, content: string) =>
    request<Message>(`/connections/${connectionId}/messages`, {
      method: "POST",
      body: JSON.stringify({ sender_business_id: senderBusinessId, content }),
    }),

  verifyBusiness: (businessId: string, verified = true) =>
    request<Business>(`/businesses/${businessId}/verify?verified=${verified}`, {
      method: "PATCH",
    }),

  deleteBusiness: (businessId: string) =>
    request(`/businesses/${businessId}`, { method: "DELETE" }),

  getNotifications: (businessId: string, unreadOnly = false) =>
    request<Notification[]>(
      `/notifications/${businessId}${unreadOnly ? "?unread_only=true" : ""}`
    ),

  markNotificationRead: (notificationId: string) =>
    request<Notification>(`/notifications/${notificationId}/read`, { method: "PATCH" }),

  markAllNotificationsRead: (businessId: string) =>
    request(`/notifications/${businessId}/read-all`, { method: "PATCH" }),

  getAnalyticsSummary: () => request<AnalyticsSummary>(`/analytics/summary`),
};