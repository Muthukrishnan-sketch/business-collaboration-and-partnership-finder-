"use client";

import { useEffect, useState } from "react";
import { api, type Connection, type Proposal, type Business } from "@/lib/api";
import { useActiveBusiness } from "@/lib/activeBusiness";
import { categoryColor, categoryLabel } from "@/lib/categoryStyles";
import { ProposalModal } from "@/components/ProposalModal";
import { ChatModal } from "@/components/ChatModal";

export default function MatchesPage() {
  const { activeBusiness, activeBusinessId, businesses } = useActiveBusiness();
  const [inbox, setInbox] = useState<Connection[]>([]);
  const [accepted, setAccepted] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justAccepted, setJustAccepted] = useState<string | null>(null);

  const load = () => {
    if (!activeBusinessId) return;
    setLoading(true);
    setError(null);
    Promise.all([
      api.getInbox(activeBusinessId),
      api.getConnectionsForBusiness(activeBusinessId, "accepted"),
    ])
      .then(([inboxData, acceptedData]) => {
        setInbox(inboxData);
        setAccepted(acceptedData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [activeBusinessId]);

  const respond = async (connectionId: string, accept: boolean) => {
    await api.respondToConnection(connectionId, accept);
    if (accept) {
      setJustAccepted(connectionId);
      setTimeout(() => setJustAccepted(null), 3000);
    }
    load();
  };

  const businessFor = (id: string) => businesses.find((b) => b.id === id);
  const otherParty = (c: Connection) =>
    c.requester_id === activeBusinessId ? c.recipient_id : c.requester_id;

  const dedupedAccepted = accepted.filter(
    (c, index) => accepted.findIndex((other) => otherParty(other) === otherParty(c)) === index
  );

  return (
    <main className="min-h-screen px-6 py-12 md:px-16 max-w-4xl mx-auto">
      <header className="mb-10">
        <p className="font-mono text-xs uppercase tracking-widest text-moss mb-2">Threadwork</p>
        <h1 className="font-display text-4xl leading-tight">Partnership requests</h1>
      </header>

      {!activeBusinessId && (
        <p className="text-sm text-ink-light border border-dashed border-line rounded-xl p-6">
          Select a business from the &ldquo;Acting as&rdquo; menu above to see requests sent to it.
        </p>
      )}

      {activeBusinessId && (
        <div className="space-y-12">
          <section>
            <h2 className="font-mono text-xs uppercase tracking-widest text-ink-light mb-3">
              Pending requests for {activeBusiness?.name ?? "…"}
            </h2>

            {loading && <p className="text-sm text-ink-light">Loading…</p>}
            {error && <p className="text-sm text-terracotta-dark">{error}</p>}
            {!loading && !error && inbox.length === 0 && (
              <p className="text-sm text-ink-light">
                No pending requests right now. Send some from the{" "}
                <a href="/" className="text-terracotta underline">Search</a> page.
              </p>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              {inbox.map((c) => {
                const requester = businessFor(c.requester_id);
                const color = requester ? categoryColor(requester.category) : "#6B7280";
                return (
                  <div
                    key={c.id}
                    className="bg-paper border border-line rounded-xl overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1"
                  >
                    <div
                      className="h-16 flex items-end p-4"
                      style={{ background: `linear-gradient(135deg, ${color}22, ${color}0a)` }}
                    >
                      {requester && (
                        <span
                          className="text-[11px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full text-white"
                          style={{ background: color }}
                        >
                          {categoryLabel(requester.category)}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-display text-lg">{businessFor(c.requester_id)?.name ?? "Unknown"}</h3>
                      {c.message && <p className="text-sm text-ink-light mt-1">{c.message}</p>}
                      <div className="mt-3 flex gap-2 items-center flex-wrap">
                        <button
                          onClick={() => respond(c.id, true)}
                          className="text-xs font-mono uppercase tracking-widest px-4 py-1.5 rounded-full bg-moss text-cream hover:opacity-90"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => respond(c.id, false)}
                          className="text-xs font-mono uppercase tracking-widest px-4 py-1.5 rounded-full border border-line text-ink-light hover:border-ink/40"
                        >
                          Decline
                        </button>
                        {justAccepted === c.id && (
                          <span className="text-xs text-moss">Accepted ↓</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-widest text-ink-light mb-3">
              Active partnerships
            </h2>

            {!loading && dedupedAccepted.length === 0 && (
              <p className="text-sm text-ink-light">
                No accepted partnerships yet. Accept a pending request above to see it here.
              </p>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              {dedupedAccepted.map((c) => (
                <PartnershipCard
                  key={c.id}
                  connection={c}
                  partner={businessFor(otherParty(c))}
                  myBusinessId={activeBusinessId}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function PartnershipCard({
  connection,
  partner,
  myBusinessId,
}: {
  connection: Connection;
  partner?: Business;
  myBusinessId: string;
}) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [showProposal, setShowProposal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [status, setStatus] = useState<"idle" | "generating" | "error">("idle");

  const color = partner ? categoryColor(partner.category) : "#6B7280";

  const generate = async () => {
    setStatus("generating");
    try {
      const result = await api.generateProposal(connection.id);
      setProposal(result);
      setShowProposal(true);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      <div className="bg-paper border border-line rounded-xl overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
        <div
          className="h-16 flex items-end p-4"
          style={{ background: `linear-gradient(135deg, ${color}22, ${color}0a)` }}
        >
          <span className="text-[11px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full bg-moss text-cream">
            Accepted
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-display text-lg">{partner?.name ?? "Unknown business"}</h3>
          {partner && (
            <p className="text-xs text-ink-light mt-0.5">{categoryLabel(partner.category)}</p>
          )}

          <div className="mt-3 flex gap-2 flex-wrap">
            <button
              onClick={() => setShowChat(true)}
              className="text-xs font-mono uppercase tracking-widest px-4 py-1.5 rounded-full border border-line hover:border-ink/40"
            >
              💬 Message
            </button>
            <button
              onClick={proposal ? () => setShowProposal(true) : generate}
              disabled={status === "generating"}
              className="text-xs font-mono uppercase tracking-widest px-4 py-1.5 rounded-full bg-terracotta text-cream hover:opacity-90 disabled:opacity-50"
            >
              {status === "generating" ? "Generating…" : proposal ? "📄 View proposal" : "📄 Proposal"}
            </button>
          </div>
          {status === "error" && (
            <p className="text-xs text-terracotta-dark mt-2">Failed to generate — try again.</p>
          )}
        </div>
      </div>

      {showChat && (
        <ChatModal
          connectionId={connection.id}
          partnerName={partner?.name ?? "Unknown"}
          myBusinessId={myBusinessId}
          onClose={() => setShowChat(false)}
        />
      )}
      {showProposal && proposal && (
        <ProposalModal proposal={proposal} partnerName={partner?.name ?? "Unknown"} onClose={() => setShowProposal(false)} />
      )}
    </>
  );
}