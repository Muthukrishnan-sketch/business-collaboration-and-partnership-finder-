"use client";

import { useEffect, useState } from "react";
import { api, type Connection, type Proposal } from "@/lib/api";
import { useActiveBusiness } from "@/lib/activeBusiness";
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

  const nameFor = (id: string) => businesses.find((b) => b.id === id)?.name ?? "Unknown business";
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
        <p className="text-sm text-ink-light border border-dashed border-line rounded-lg p-6">
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
                <a href="/" className="text-terracotta underline">
                  Search
                </a>{" "}
                page.
              </p>
            )}

            <div className="space-y-3">
              {inbox.map((c) => (
                <div key={c.id} className="bg-paper border border-line rounded-xl p-4">
                  <h3 className="font-display text-lg">{nameFor(c.requester_id)}</h3>
                  {c.message && <p className="text-sm text-ink-light mt-1">{c.message}</p>}
                  <div className="mt-3 flex gap-2 items-center">
                    <button
                      onClick={() => respond(c.id, true)}
                      className="text-xs font-mono uppercase tracking-widest px-3 py-1.5 rounded-md bg-moss text-cream hover:opacity-90"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => respond(c.id, false)}
                      className="text-xs font-mono uppercase tracking-widest px-3 py-1.5 rounded-md border border-line text-ink-light hover:border-ink/40"
                    >
                      Decline
                    </button>
                    {justAccepted === c.id && (
                      <span className="text-xs text-moss">Accepted — see it below ↓</span>
                    )}
                  </div>
                </div>
              ))}
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

            <div className="space-y-3">
              {dedupedAccepted.map((c) => (
                <PartnershipCard
                  key={c.id}
                  connection={c}
                  partnerName={nameFor(otherParty(c))}
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
  partnerName,
  myBusinessId,
}: {
  connection: Connection;
  partnerName: string;
  myBusinessId: string;
}) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [showProposal, setShowProposal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [status, setStatus] = useState<"idle" | "generating" | "error">("idle");

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
      <div className="bg-moss/5 border border-moss/30 rounded-xl p-4">
        <h3 className="font-display text-lg">{partnerName}</h3>
        <p className="text-xs font-mono text-moss uppercase tracking-widest mt-0.5">Accepted</p>

        <div className="mt-3 flex gap-2 flex-wrap">
          <button
            onClick={() => setShowChat(true)}
            className="text-xs font-mono uppercase tracking-widest px-3 py-1.5 rounded-md border border-line hover:border-ink/40"
          >
            💬 Message
          </button>
          <button
            onClick={proposal ? () => setShowProposal(true) : generate}
            disabled={status === "generating"}
            className="text-xs font-mono uppercase tracking-widest px-3 py-1.5 rounded-md bg-ink text-cream hover:opacity-90 disabled:opacity-50"
          >
            {status === "generating" ? "Generating…" : proposal ? "📄 View proposal" : "📄 Proposal"}
          </button>
        </div>
        {status === "error" && (
          <p className="text-xs text-terracotta-dark mt-2">Failed to generate — try again.</p>
        )}
      </div>

      {showChat && (
        <ChatModal
          connectionId={connection.id}
          partnerName={partnerName}
          myBusinessId={myBusinessId}
          onClose={() => setShowChat(false)}
        />
      )}

      {showProposal && proposal && (
        <ProposalModal
          proposal={proposal}
          partnerName={partnerName}
          onClose={() => setShowProposal(false)}
        />
      )}
    </>
  );
}