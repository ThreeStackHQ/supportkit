import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, tickets, workspaces, contacts } from "@supportkit/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createTicketSchema = z.object({
  contactId: z.string().uuid(),
  subject: z.string().min(1).max(255),
  source: z.enum(["email", "widget"]).optional().default("email"),
  body: z.string().min(1).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as "open" | "pending" | "resolved" | null;

    // Get user's workspace
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.userId, session.user.id))
      .limit(1);

    if (!workspace) {
      return NextResponse.json({ tickets: [] });
    }

    const conditions = [eq(tickets.workspaceId, workspace.id)];
    if (status) {
      conditions.push(eq(tickets.status, status));
    }

    const result = await db
      .select({
        id: tickets.id,
        subject: tickets.subject,
        status: tickets.status,
        source: tickets.source,
        createdAt: tickets.createdAt,
        updatedAt: tickets.updatedAt,
        contact: {
          id: contacts.id,
          email: contacts.email,
          name: contacts.name,
        },
      })
      .from(tickets)
      .innerJoin(contacts, eq(tickets.contactId, contacts.id))
      .where(and(...conditions))
      .orderBy(tickets.createdAt);

    return NextResponse.json({ tickets: result });
  } catch (err) {
    console.error("List tickets error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json() as unknown;
    const parsed = createTicketSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.userId, session.user.id))
      .limit(1);

    if (!workspace) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    // Verify contact belongs to workspace
    const [contact] = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.id, parsed.data.contactId),
          eq(contacts.workspaceId, workspace.id)
        )
      )
      .limit(1);

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const [ticket] = await db
      .insert(tickets)
      .values({
        workspaceId: workspace.id,
        contactId: parsed.data.contactId,
        subject: parsed.data.subject,
        source: parsed.data.source,
        status: "open",
      })
      .returning();

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (err) {
    console.error("Create ticket error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
