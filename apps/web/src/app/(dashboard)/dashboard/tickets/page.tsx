import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db, tickets, workspaces, contacts } from "@supportkit/db";
import { eq, and, desc } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.userId, session.user.id))
    .limit(1);

  const statusFilter = (searchParams.status as "open" | "pending" | "resolved") ?? "open";

  const rows = workspace
    ? await db
        .select({
          id: tickets.id,
          subject: tickets.subject,
          status: tickets.status,
          source: tickets.source,
          createdAt: tickets.createdAt,
          updatedAt: tickets.updatedAt,
          contactEmail: contacts.email,
          contactName: contacts.name,
        })
        .from(tickets)
        .innerJoin(contacts, eq(tickets.contactId, contacts.id))
        .where(
          and(
            eq(tickets.workspaceId, workspace.id),
            eq(tickets.status, statusFilter)
          )
        )
        .orderBy(desc(tickets.updatedAt))
    : [];

  const statusColors: Record<string, string> = {
    open: "bg-blue-100 text-blue-700",
    pending: "bg-yellow-100 text-yellow-700",
    resolved: "bg-green-100 text-green-700",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-semibold text-gray-900">SupportKit</span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-900">
            Overview
          </Link>
          <Link href="/dashboard/tickets" className="text-violet-600 font-medium">
            Tickets
          </Link>
          <span className="text-sm text-gray-600">{session.user.email}</span>
        </nav>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Ticket Inbox</h1>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 mb-6">
          {(["open", "pending", "resolved"] as const).map((s) => (
            <Link
              key={s}
              href={`/dashboard/tickets?status=${s}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                statusFilter === s
                  ? "bg-violet-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s}
            </Link>
          ))}
        </div>

        {rows.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No {statusFilter} tickets.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {rows.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/dashboard/tickets/${ticket.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{ticket.subject}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {ticket.contactName ?? ticket.contactEmail} ·{" "}
                    {ticket.source === "widget" ? "🟢 Widget" : "📧 Email"} ·{" "}
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`ml-4 text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                    statusColors[ticket.status] ?? ""
                  }`}
                >
                  {ticket.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
