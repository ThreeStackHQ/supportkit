import { NextRequest, NextResponse } from "next/server";
import {
  db,
  workspaces,
  contacts,
  tickets,
  messages,
} from "@supportkit/db";
import { eq, and } from "drizzle-orm";
import { createHmac, timingSafeEqual } from "crypto";

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

/**
 * Verify Resend webhook signature (HMAC-SHA256).
 * Resend sends:
 *   svix-id, svix-timestamp, svix-signature  headers
 *   (Standard Webhook spec – https://docs.resend.com/docs/webhooks)
 */
function verifyResendSignature(
  rawBody: string,
  headers: NextRequest["headers"]
): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    // If no secret is configured, skip verification (dev mode)
    console.warn("RESEND_WEBHOOK_SECRET not set – skipping signature check");
    return true;
  }

  const svixId = headers.get("svix-id");
  const svixTimestamp = headers.get("svix-timestamp");
  const svixSignature = headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return false;
  }

  // Reject requests older than 5 minutes to prevent replay attacks
  const timestampMs = Number(svixTimestamp) * 1000;
  if (Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    return false;
  }

  // Standard Webhook signing: "id.timestamp.body"
  const signedPayload = `${svixId}.${svixTimestamp}.${rawBody}`;

  // Secret may be prefixed with "whsec_" (base64)
  const secretBytes = secret.startsWith("whsec_")
    ? Buffer.from(secret.slice(6), "base64")
    : Buffer.from(secret);

  const expectedHex = createHmac("sha256", secretBytes)
    .update(signedPayload)
    .digest("hex");

  // svix-signature may contain multiple "v1,<hex>" entries
  const signatures = svixSignature.split(" ");
  for (const sig of signatures) {
    const parts = sig.split(",");
    if (parts.length !== 2 || parts[0] !== "v1") continue;
    const actualHex = parts[1] ?? "";
    try {
      const expected = Buffer.from(expectedHex, "hex");
      const actual = Buffer.from(actualHex, "hex");
      if (
        expected.length === actual.length &&
        timingSafeEqual(expected, actual)
      ) {
        return true;
      }
    } catch {
      // invalid hex — try next
    }
  }

  return false;
}

export async function POST(req: NextRequest) {
  try {
    // Read raw body for signature verification
    const rawBody = await req.text();

    // --- Signature verification ---
    if (!verifyResendSignature(rawBody, req.headers)) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    const body = JSON.parse(rawBody) as ResendInboundPayload;

    const fromRaw = body.from ?? "";
    const toRaw = body.to ?? "";
    const subject = body.subject ?? "(no subject)";
    const bodyText = body.text ?? body.html ?? "";
    const messageId = body.messageId ?? body.headers?.["message-id"] ?? "";

    const senderEmail = extractEmail(fromRaw);
    const senderName = extractName(fromRaw);
    const toEmail = extractEmail(toRaw);

    // Find workspace by email address (support@slug.supportkit.io)
    // Correct extraction: slug is the first label of the hostname, e.g.
    //   "support@jane-abc123.supportkit.io"  →  slug = "jane-abc123"
    const hostname = toEmail.split("@")[1] ?? "";
    const slug = hostname.split(".")[0] ?? "";

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
