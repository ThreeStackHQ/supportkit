import { db, subscriptions } from "@supportkit/db";
import { eq } from "drizzle-orm";

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
