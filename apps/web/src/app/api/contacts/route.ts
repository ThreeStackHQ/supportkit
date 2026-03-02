import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, contacts, workspaces } from "@supportkit/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.userId, session.user.id))
      .limit(1);

    if (!workspace) {
      return NextResponse.json({ contacts: [] });
    }

    const result = await db
      .select()
      .from(contacts)
      .where(eq(contacts.workspaceId, workspace.id))
      .orderBy(contacts.createdAt);

    return NextResponse.json({ contacts: result });
  } catch (err) {
    console.error("List contacts error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
