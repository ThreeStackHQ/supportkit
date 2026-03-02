import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, contacts, workspaces, tickets } from "@supportkit/db";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    const [contact] = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.id, params.id),
          eq(contacts.workspaceId, workspace.id)
        )
      )
      .limit(1);

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const contactTickets = await db
      .select()
      .from(tickets)
      .where(eq(tickets.contactId, params.id))
      .orderBy(tickets.createdAt);

    return NextResponse.json({ contact, tickets: contactTickets });
  } catch (err) {
    console.error("Get contact error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
