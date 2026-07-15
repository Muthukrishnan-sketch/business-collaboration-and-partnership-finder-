"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/Modal";
import { api, type Message } from "@/lib/api";

export function ChatModal({
  connectionId,
  partnerName,
  myBusinessId,
  onClose,
}: {
  connectionId: string;
  partnerName: string;
  myBusinessId: string;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = () => {
    api.getMessages(connectionId).then(setMessages).catch(() => {});
  };

  useEffect(() => {
    load();
    // Simple polling — a real-time subscription (Supabase Realtime) is the
    // natural upgrade here, this keeps things working without that setup.
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!draft.trim()) return;
    setSending(true);
    try {
      await api.sendMessage(connectionId, myBusinessId, draft.trim());
      setDraft("");
      load();
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal title={`Chat — ${partnerName}`} onClose={onClose}>
      <div className="flex flex-col h-[50vh]">
        <div className="flex-1 overflow-y-auto space-y-2 mb-3">
          {messages.length === 0 && (
            <p className="text-sm text-ink-light">
              No messages yet — say hello to kick off the partnership.
            </p>
          )}
          {messages.map((m) => {
            const isMe = m.sender_business_id === myBusinessId;
            return (
              <div
                key={m.id}
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                  isMe ? "bg-ink text-cream ml-auto" : "bg-cream-dim text-ink"
                }`}
              >
                {m.content}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message…"
            className="flex-1 border border-line rounded-md px-3 py-2 text-sm bg-paper"
          />
          <button
            onClick={send}
            disabled={sending}
            className="px-4 rounded-md bg-terracotta text-cream text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </Modal>
  );
}