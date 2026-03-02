import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db, tickets, workspaces, messages } from "@supportkit/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.userId, session.user.id))
    .limit(1);

  const openTickets = workspace
    ? await db
        .select()
        .from(tickets)
        .where(eq(tickets.workspaceId, workspace.id))
    : [];

  const open = openTickets.filter((t) => t.status === "open").length;
  const pending = openTickets.filter((t) => t.status === "pending").length;
  const resolved = openTickets.filter((t) => t.status === "resolved").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-semibold text-gray-900">SupportKit</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{session.user.email}</span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Open tickets</p>
            <p className="text-3xl font-bold text-gray-900">{open}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Pending</p>
            <p className="text-3xl font-bold text-gray-900">{pending}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Resolved</p>
            <p className="text-3xl font-bold text-gray-900">{resolved}</p>
          </div>
        </div>

        {workspace && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Your workspace</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Workspace name</span>
                <span className="font-medium">{workspace.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Widget key</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                  {workspace.widgetKey.slice(0, 16)}...
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Support email</span>
                <span className="font-medium">
                  support@{workspace.slug}.supportkit.io
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
