"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Message {
  id: string;
  body: string;
  senderType: "agent" | "contact";
  isInternal: boolean;
  createdAt: string;
}

interface Ticket {
  id: string;
  subject: string;
  status: "open" | "pending" | "resolved";
  source: "email" | "widget";
  createdAt: string;
  contact: { id: string; email: string; name?: string };
  messages: Message[];
}

export default function TicketDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch(`/api/tickets/${params.id}`);
    if (!res.ok) {
      setError("Ticket not found");
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { ticket: Ticket };
    setTicket(data.ticket);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    setError("");

    const res = await fetch(`/api/tickets/${params.id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: reply }),
    });

    if (res.ok) {
      setReply("");
      await load();
    } else {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Failed to send reply");
    }
    setSending(false);
  }

  async function updateStatus(status: "open" | "pending" | "resolved") {
    await fetch(`/api/tickets/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">{error || "Ticket not found"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-semibold text-gray-900">SupportKit</span>
        </div>
        <Link href="/dashboard/tickets" className="text-sm text-violet-600 hover:underline">
          ← Back to inbox
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{ticket.subject}</h1>
              <p className="text-sm text-gray-500 mt-1">
                From: {ticket.contact.name ?? ticket.contact.email} &lt;{ticket.contact.email}&gt;
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {(["open", "pending", "resolved"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full capitalize transition ${
                    ticket.status === s
                      ? "bg-violet-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {ticket.messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-xl p-4 ${
                msg.senderType === "agent"
                  ? "bg-violet-50 border border-violet-100 ml-8"
                  : "bg-white border border-gray-200 mr-8"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {msg.senderType === "agent" ? "You (agent)" : ticket.contact.name ?? "Customer"}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(msg.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.body}</p>
            </div>
          ))}

          {ticket.messages.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No messages yet.</p>
          )}
        </div>

        <form onSubmit={sendReply} className="bg-white rounded-xl border border-gray-200 p-4">
          {error && (
            <div className="mb-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply…"
            rows={4}
            className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={sending || !reply.trim()}
              className="bg-violet-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? "Sending…" : "Send reply"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
