"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Send,
  Sparkles,
  Loader2,
  MailOpen,
  MessageSquare,
  RefreshCw,
  ChevronDown,
  InboxIcon,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TicketSummary {
  id: string;
  subject: string;
  status: "open" | "pending" | "resolved";
  source: "email" | "widget";
  createdAt: string;
  updatedAt: string;
  contact: {
    id: string;
    email: string;
    name: string | null;
  };
}

interface Message {
  id: string;
  body: string;
  isAgent: boolean;
  createdAt: string;
}

interface TicketDetail extends TicketSummary {
  messages: Message[];
}

// ─── Mock data fallback ───────────────────────────────────────────────────────

const MOCK_TICKETS: TicketSummary[] = [
  {
    id: "mock-1",
    subject: "How do I reset my password?",
    status: "open",
    source: "email",
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    contact: { id: "c1", email: "alice@example.com", name: "Alice Chen" },
  },
  {
    id: "mock-2",
    subject: "Billing issue — charged twice this month",
    status: "pending",
    source: "widget",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    contact: { id: "c2", email: "bob@startup.io", name: "Bob Martinez" },
  },
  {
    id: "mock-3",
    subject: "Feature request: CSV export for contacts",
    status: "open",
    source: "email",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    contact: { id: "c3", email: "carol@saas.dev", name: "Carol Singh" },
  },
  {
    id: "mock-4",
    subject: "Widget not loading on my site",
    status: "resolved",
    source: "widget",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    contact: { id: "c4", email: "dan@indie.co", name: "Dan Park" },
  },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  "mock-1": [
    {
      id: "m1",
      body: "Hi! I forgot my password and can't find the reset link anywhere. Can you help?",
      isAgent: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 16).toISOString(),
    },
    {
      id: "m2",
      body: "Hi Alice! No worries. You can reset your password from the login page by clicking 'Forgot password?' — a reset link will be sent to your email within a minute.",
      isAgent: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    },
  ],
  "mock-2": [
    {
      id: "m3",
      body: "I just noticed I was charged $9 twice on April 1st. Please check this ASAP.",
      isAgent: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 121).toISOString(),
    },
  ],
  "mock-3": [
    {
      id: "m5",
      body: "Would love to be able to export all my contacts as a CSV. Any plans for this feature?",
      isAgent: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 61 * 5).toISOString(),
    },
  ],
  "mock-4": [
    {
      id: "m7",
      body: "The chat widget isn't showing up on my site at all. Script is in the right place.",
      isAgent: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
    },
    {
      id: "m8",
      body: "I checked the widget config — it looks like the domain wasn't whitelisted. I've updated that for you. The widget should load now!",
      isAgent: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
    },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(date: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return "recently";
  }
}

const statusColors: Record<string, string> = {
  open: "bg-violet-600/20 text-violet-400 border border-violet-500/30",
  pending: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  resolved: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [aiDrafting, setAiDrafting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [useMock, setUseMock] = useState(false);

  // Fetch ticket list
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tickets");
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json() as { tickets: TicketSummary[] };
      setTickets(data.tickets ?? []);
      setUseMock(false);
    } catch {
      setTickets(MOCK_TICKETS);
      setUseMock(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTickets();
  }, [fetchTickets]);

  // Fetch ticket detail
  const selectTicket = async (t: TicketSummary) => {
    setDetailLoading(true);
    setReplyText("");
    try {
      if (useMock) {
        const msgs = MOCK_MESSAGES[t.id] ?? [];
        setSelectedTicket({ ...t, messages: msgs });
      } else {
        const res = await fetch(`/api/tickets/${t.id}`);
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json() as { ticket: TicketDetail };
        setSelectedTicket(data.ticket);
      }
    } catch {
      const msgs = MOCK_MESSAGES[t.id] ?? [];
      setSelectedTicket({ ...t, messages: msgs });
    } finally {
      setDetailLoading(false);
    }
  };

  // Send reply
  const sendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setSendingReply(true);
    try {
      if (!useMock) {
        const res = await fetch(`/api/tickets/${selectedTicket.id}/reply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: replyText }),
        });
        if (res.ok) {
          const data = await res.json() as { message: string };
          const newMsg: Message = {
            id: crypto.randomUUID(),
            body: data.message ?? replyText,
            isAgent: true,
            createdAt: new Date().toISOString(),
          };
          setSelectedTicket((prev) =>
            prev ? { ...prev, messages: [...prev.messages, newMsg] } : prev
          );
        }
      } else {
        const newMsg: Message = {
          id: crypto.randomUUID(),
          body: replyText,
          isAgent: true,
          createdAt: new Date().toISOString(),
        };
        setSelectedTicket((prev) =>
          prev ? { ...prev, messages: [...prev.messages, newMsg] } : prev
        );
      }
      setReplyText("");
    } catch {
      // Optimistic add anyway
      const newMsg: Message = {
        id: crypto.randomUUID(),
        body: replyText,
        isAgent: true,
        createdAt: new Date().toISOString(),
      };
      setSelectedTicket((prev) =>
        prev ? { ...prev, messages: [...prev.messages, newMsg] } : prev
      );
      setReplyText("");
    } finally {
      setSendingReply(false);
    }
  };

  // AI Draft
  const generateDraft = async () => {
    if (!selectedTicket) return;
    setAiDrafting(true);
    try {
      const res = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          message: selectedTicket.messages[selectedTicket.messages.length - 1]?.body ?? "",
        }),
      });
      if (res.ok) {
        const data = await res.json() as { draft: string };
        setReplyText(data.draft ?? "");
      } else {
        setReplyText(
          `Hi ${selectedTicket.contact.name ?? "there"}! Thanks for reaching out. I'm looking into this for you and will get back to you shortly.`
        );
      }
    } catch {
      setReplyText(
        `Hi ${selectedTicket.contact.name ?? "there"}! Thanks for reaching out. I'm looking into this for you and will get back to you shortly.`
      );
    } finally {
      setAiDrafting(false);
    }
  };

  // Update status
  const updateStatus = async (status: "open" | "pending" | "resolved") => {
    if (!selectedTicket) return;
    setStatusUpdating(true);
    try {
      if (!useMock) {
        await fetch(`/api/tickets/${selectedTicket.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
      }
      setSelectedTicket((prev) => (prev ? { ...prev, status } : prev));
      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicket.id ? { ...t, status } : t))
      );
    } catch {
      /* ignore */
    } finally {
      setStatusUpdating(false);
    }
  };

  // Stats
  const total = tickets.length;
  const open = tickets.filter((t) => t.status === "open").length;
  const pending = tickets.filter((t) => t.status === "pending").length;
  const resolved = tickets.filter((t) => t.status === "resolved").length;

  return (
    <div className="flex h-full overflow-hidden bg-[#0f0f0f]">
      {/* ── LEFT PANEL ── */}
      <div className="w-96 flex-shrink-0 flex flex-col border-r border-white/10 overflow-hidden">
        {/* Stats bar */}
        <div className="px-4 py-3 border-b border-white/10 bg-[#111111]">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-sm font-semibold text-white">Ticket Inbox</h1>
            {useMock && (
              <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
                Demo data
              </span>
            )}
            <button
              onClick={fetchTickets}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Total", value: total, color: "text-white" },
              { label: "Open", value: open, color: "text-violet-400" },
              { label: "Pending", value: pending, color: "text-amber-400" },
              { label: "Resolved", value: resolved, color: "text-emerald-400" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/5 rounded-lg p-2 text-center"
              >
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ticket list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <InboxIcon className="w-8 h-8 mb-2" />
              <p className="text-sm">No tickets yet</p>
            </div>
          ) : (
            tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => selectTicket(t)}
                className={`w-full text-left px-4 py-3.5 border-b border-white/5 hover:bg-white/5 transition-colors ${
                  selectedTicket?.id === t.id ? "bg-violet-600/10 border-l-2 border-l-violet-500" : ""
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-lg mt-0.5 flex-shrink-0">
                    {t.source === "email" ? "📧" : "💬"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-white truncate">
                        {t.contact.name ?? t.contact.email}
                      </span>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {timeAgo(t.updatedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mb-1.5">{t.subject}</p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[t.status]}`}
                    >
                      {t.status}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      {selectedTicket ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10 bg-[#111111] flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-sm font-semibold text-white truncate">
                  {selectedTicket.contact.name ?? selectedTicket.contact.email}
                </h2>
                <span className="flex-shrink-0 text-lg">
                  {selectedTicket.source === "email" ? "📧" : "💬"}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate">{selectedTicket.subject}</p>
            </div>

            {/* Status dropdown */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative">
                <select
                  value={selectedTicket.status}
                  onChange={(e) =>
                    updateStatus(e.target.value as "open" | "pending" | "resolved")
                  }
                  disabled={statusUpdating}
                  className="appearance-none bg-white/10 border border-white/20 text-white text-xs font-medium px-3 py-1.5 pr-7 rounded-lg cursor-pointer hover:bg-white/15 transition disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  <option value="open" className="bg-[#1a1a1a]">Open</option>
                  <option value="pending" className="bg-[#1a1a1a]">Pending</option>
                  <option value="resolved" className="bg-[#1a1a1a]">Resolved</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
              {statusUpdating && <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />}
            </div>
          </div>

          {/* Message thread */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {detailLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
              </div>
            ) : selectedTicket.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <MessageSquare className="w-6 h-6 mb-2" />
                <p className="text-sm">No messages yet</p>
              </div>
            ) : (
              selectedTicket.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isAgent ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      msg.isAgent
                        ? "bg-violet-600 text-white rounded-br-md"
                        : "bg-white/8 text-gray-200 rounded-bl-md border border-white/10"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                    <p
                      className={`text-xs mt-1.5 ${
                        msg.isAgent ? "text-violet-300" : "text-gray-500"
                      }`}
                    >
                      {timeAgo(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Reply box */}
          <div className="px-6 py-4 border-t border-white/10 bg-[#111111]">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              rows={3}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  void sendReply();
                }
              }}
            />
            <div className="flex items-center justify-between mt-3">
              <button
                onClick={generateDraft}
                disabled={aiDrafting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10 transition disabled:opacity-50"
              >
                {aiDrafting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                )}
                {aiDrafting ? "Drafting..." : "AI Draft"}
              </button>
              <button
                onClick={sendReply}
                disabled={sendingReply || !replyText.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingReply ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                {sendingReply ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <MailOpen className="w-12 h-12 mb-3 text-gray-700" />
          <p className="text-base font-medium text-gray-600">Select a ticket to view</p>
          <p className="text-sm mt-1">Click any ticket from the list on the left</p>
        </div>
      )}
    </div>
  );
}
