import { db, subscriptions, tickets, workspaces, eq, and } from "@supportkit/db";
import { gte, sql } from "drizzle-orm";

export type Tier = "free" | "indie" | "pro";

export async function getUserTier(userId: string): Promise<Tier> {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (!sub || sub.status !== "active") return "free";
  return sub.tier as Tier;
}

export async function canUseDraftAI(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId);
  return tier === "pro";
}

export async function canCreateWorkspace(userId: string): Promise<boolean> {
  // All tiers can create workspaces (limits differ)
  return true;
}

/**
 * Check whether the workspace is allowed to create a new ticket
 * based on the owner's subscription tier (free: 50/month cap).
 */
export async function canCreateTicket(workspaceId: string): Promise<boolean> {
  // Find the workspace owner
  const [workspace] = await db
    .select({ userId: workspaces.userId })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) return false;

  const tier = await getUserTier(workspace.userId);
  const limits = getTierLimits(tier);

  if (limits.ticketsPerMonth === Infinity) return true;

  // Count tickets created this calendar month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(tickets)
    .where(
      and(
        eq(tickets.workspaceId, workspaceId),
        gte(tickets.createdAt, startOfMonth)
      )
    );

  const used = row?.count ?? 0;
  return used < limits.ticketsPerMonth;
}

export function getTierLimits(tier: Tier) {
  switch (tier) {
    case "free":
      return { ticketsPerMonth: 50, workspaces: 1, aiDrafts: false };
    case "indie":
      return { ticketsPerMonth: Infinity, workspaces: 3, aiDrafts: false };
    case "pro":
      return { ticketsPerMonth: Infinity, workspaces: Infinity, aiDrafts: true };
  }
}
