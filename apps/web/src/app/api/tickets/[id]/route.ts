import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, tickets, workspaces, contacts, messages } from "@supportkit/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateTicketSchema = z.object({
  status: z.enum(["open", "pending", "resolved"]).optional(),
  assignedToId: z.string().uuid().nullable().optional(),
}).strict();

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [row] = await db
      .select({
        ticket: tickets,
        contact: contacts,
      })
      .from(tickets)
      .innerJoin(workspaces, eq(tickets.workspaceId, workspaces.id))
      .innerJoin(contacts, eq(tickets.contactId, contacts.id))
      .where(
        and(
          eq(tickets.id, params.id),
          eq(workspaces.userId, session.user.id)
        )
      )
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const ticketMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.ticketId, params.id))
      .orderBy(messages.createdAt);

    return NextResponse.json({
      ticket: { ...row.ticket, contact: row.contact, messages: ticketMessages },
    });
  } catch (err) {
    console.error("Get ticket error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json() as unknown;
    const parsed = updateTicketSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify ownership
    const [existing] = await db
      .select({ id: tickets.id })
      .from(tickets)
      .innerJoin(workspaces, eq(tickets.workspaceId, workspaces.id))
      .where(
        and(
          eq(tickets.id, params.id),
          eq(workspaces.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const updateData: Partial<typeof tickets.$inferInsert> = {};
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.assignedToId !== undefined)
      updateData.assignedToId = parsed.data.assignedToId;

    const [ticket] = await db
      .update(tickets)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(tickets.id, params.id))
      .returning();

    return NextResponse.json({ ticket });
  } catch (err) {
    console.error("Update ticket error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [existing] = await db
      .select({ id: tickets.id })
      .from(tickets)
      .innerJoin(workspaces, eq(tickets.workspaceId, workspaces.id))
      .where(
        and(
          eq(tickets.id, params.id),
          eq(workspaces.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    await db.delete(tickets).where(eq(tickets.id, params.id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete ticket error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
