import { NextRequest, NextResponse } from "next/server";
import {
  db,
  workspaces,
  contacts,
  tickets,
  messages,
} from "@supportkit/db";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface ResendInboundPayload {
  from?: string;
  to?: string;
  subject?: string;
  text?: string;
  html?: string;
  headers?: Record<string, string>;
  messageId?: string;
}

function extractEmail(from: string): string {
  const match = from.match(/<(.+)>/);
  return match?.[1] ?? from.trim();
}

function extractName(from: string): string {
  const match = from.match(/^(.+)\s*</);
  return match?.[1]?.trim() ?? from.split("@")[0] ?? "Unknown";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as ResendInboundPayload;

    const fromRaw = body.from ?? "";
    const toRaw = body.to ?? "";
    const subject = body.subject ?? "(no subject)";
    const bodyText = body.text ?? body.html ?? "";
    const messageId = body.messageId ?? body.headers?.["message-id"] ?? "";

    const senderEmail = extractEmail(fromRaw);
    const senderName = extractName(fromRaw);
    const toEmail = extractEmail(toRaw);

    // Find workspace by email address (support@slug.supportkit.io)
    const slug = toEmail.split("@")[0]?.replace(/^support\./, "") ?? "";

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.slug, slug))
      .limit(1);

    if (!workspace) {
      // Try to find by email_address field
      const [ws] = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.emailAddress, toEmail))
        .limit(1);

      if (!ws) {
        return NextResponse.json(
          { error: "Workspace not found" },
          { status: 404 }
        );
      }
    }

    const activeWorkspace = workspace ?? (await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.emailAddress, toEmail))
      .limit(1)
      .then((r) => r[0]));

    if (!activeWorkspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Find or create contact
    let [contact] = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.workspaceId, activeWorkspace.id),
          eq(contacts.email, senderEmail)
        )
      )
      .limit(1);

    if (!contact) {
      const inserted = await db
        .insert(contacts)
        .values({
          workspaceId: activeWorkspace.id,
          email: senderEmail,
          name: senderName,
        })
        .returning();
      contact = inserted[0]!;
    }

    // Check for existing ticket by thread-id
    let existingTicket = null;
    if (messageId) {
      const [found] = await db
        .select()
        .from(tickets)
        .where(
          and(
            eq(tickets.workspaceId, activeWorkspace.id),
            eq(tickets.emailThreadId, messageId)
          )
        )
        .limit(1);
      existingTicket = found ?? null;
    }

    // Also check by subject if no thread-id match
    if (!existingTicket) {
      const [found] = await db
        .select()
        .from(tickets)
        .where(
          and(
            eq(tickets.workspaceId, activeWorkspace.id),
            eq(tickets.contactId, contact.id),
            eq(tickets.subject, subject)
          )
        )
        .limit(1);
      existingTicket = found ?? null;
    }

    if (existingTicket) {
      // Append message to existing ticket
      await db.insert(messages).values({
        ticketId: existingTicket.id,
        body: bodyText,
        senderType: "contact",
        isInternal: false,
      });

      return NextResponse.json({ ticketId: existingTicket.id, action: "appended" });
    } else {
      // Create new ticket
      const [ticket] = await db
        .insert(tickets)
        .values({
          workspaceId: activeWorkspace.id,
          contactId: contact.id,
          subject,
          status: "open",
          source: "email",
          emailThreadId: messageId || null,
        })
        .returning();

      if (!ticket) {
        return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
      }

      await db.insert(messages).values({
        ticketId: ticket.id,
        body: bodyText,
        senderType: "contact",
        isInternal: false,
      });

      return NextResponse.json({ ticketId: ticket.id, action: "created" });
    }
  } catch (err) {
    console.error("Email inbound error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
