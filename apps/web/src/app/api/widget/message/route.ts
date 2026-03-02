import { NextRequest, NextResponse } from "next/server";
import { db, workspaces, contacts, tickets, messages } from "@supportkit/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const messageSchema = z.object({
  widgetKey: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  subject: z.string().min(1).max(255),
  body: z.string().min(1).max(10000),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const parsed = messageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400, headers: corsHeaders }
      );
    }

    const { widgetKey, email, name, subject, body: messageBody } = parsed.data;

    // Find workspace by widget key
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.widgetKey, widgetKey))
      .limit(1);

    if (!workspace) {
      return NextResponse.json(
        { error: "Invalid widget key" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Find or create contact
    let [contact] = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.workspaceId, workspace.id),
          eq(contacts.email, email)
        )
      )
      .limit(1);

    if (!contact) {
      const inserted = await db
        .insert(contacts)
        .values({
          workspaceId: workspace.id,
          email,
          name,
        })
        .returning();
      contact = inserted[0]!;
    }

    // Create ticket
    const [ticket] = await db
      .insert(tickets)
      .values({
        workspaceId: workspace.id,
        contactId: contact.id,
        subject,
        status: "open",
        source: "widget",
      })
      .returning();

    if (!ticket) {
      return NextResponse.json(
        { error: "Failed to create ticket" },
        { status: 500, headers: corsHeaders }
      );
    }

    // Create first message
    await db.insert(messages).values({
      ticketId: ticket.id,
      body: messageBody,
      senderType: "contact",
      isInternal: false,
    });

    return NextResponse.json(
      {
        ticketId: ticket.id,
        message: "We'll get back to you soon!",
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (err) {
    console.error("Widget message error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
