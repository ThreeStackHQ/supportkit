import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  db,
  tickets,
  messages,
  contacts,
  workspaces,
} from "@supportkit/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const replySchema = z.object({
  body: z.string().min(1).max(10000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json() as unknown;
    const parsed = replySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify ticket belongs to user's workspace
    const [ticket] = await db
      .select({
        ticket: tickets,
        workspace: workspaces,
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

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Create message
    const [message] = await db
      .insert(messages)
      .values({
        ticketId: params.id,
        body: parsed.data.body,
        senderType: "agent",
        isInternal: false,
      })
      .returning();

    // Send email reply via Resend
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromEmail = `support@${ticket.workspace.slug}.supportkit.io`;

      await resend.emails.send({
        from: fromEmail,
        to: ticket.contact.email,
        subject: `Re: ${ticket.ticket.subject}`,
        text: parsed.data.body,
      });
    }

    return NextResponse.json({ message }, { status: 200 });
  } catch (err) {
    console.error("Reply error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
