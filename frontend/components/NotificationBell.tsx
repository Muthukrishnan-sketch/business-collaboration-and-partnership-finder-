"use client";

import { useEffect, useState } from "react";
import { api, type Notification } from "@/lib/api";

export function NotificationBell({ businessId }: { businessId: string | null }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const load = () => {
    if (!businessId) return;
    api.getNotifications(businessId).then(setNotifications).catch(() => {});
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  if (!businessId) return null;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleOpen = () => {
    setOpen((prev) => !prev);
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead(businessId);
    load();
  };

  return (
    <div className="relative">
      <button onClick={handleOpen} className="relative text-sm px-1.5 py-1" aria-label="Notifications">
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-terracotta text-cream text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-paper border border-line rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between px-3 py-2 border-b border-line">
            <span className="text-xs font-mono uppercase tracking-widest text-ink-light">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-terracotta hover:underline">
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 && (
            <p className="text-sm text-ink-light p-3">No notifications yet.</p>
          )}
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`px-3 py-2 text-sm border-b border-line last:border-0 ${
                n.is_read ? "text-ink-light" : "text-ink"
              }`}
            >
              {n.message}
              <div className="text-[10px] font-mono text-ink-light mt-0.5">
                {new Date(n.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}