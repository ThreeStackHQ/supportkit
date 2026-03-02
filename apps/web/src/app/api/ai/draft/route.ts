import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, tickets, messages, workspaces } from "@supportkit/db";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { canUseDraftAI } from "@/lib/tier";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

const draftSchema = z.object({
  ticketId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check tier
    const allowed = await canUseDraftAI(session.user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: "AI drafts require Pro plan" },
        { status: 403 }
      );
    }

    const body = await req.json() as unknown;
    const parsed = draftSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify ticket belongs to user's workspace
    const [ticket] = await db
      .select({ id: tickets.id, subject: tickets.subject })
      .from(tickets)
      .innerJoin(workspaces, eq(tickets.workspaceId, workspaces.id))
      .where(
        and(
          eq(tickets.id, parsed.data.ticketId),
          eq(workspaces.userId, session.user.id)
        )
      )
      .limit(1);

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Get last 5 messages
    const recentMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.ticketId, ticket.id))
      .orderBy(desc(messages.createdAt))
      .limit(5);

    const conversationText = recentMessages
      .reverse()
      .map((m) => `${m.senderType === "agent" ? "Agent" : "Customer"}: ${m.body}`)
      .join("\n\n");

    if (!process.env.OPENAI_API_KEY) {
      // Mock draft
      return NextResponse.json({
        draft: `Thank you for reaching out! I understand your concern about "${ticket.subject}". I'd be happy to help you resolve this. Could you please provide more details so I can assist you better?`,
      });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a friendly, professional support agent. Suggest a concise and helpful reply to the following support ticket conversation. Return only the reply text, no subject line or greeting prefix.",
        },
        {
          role: "user",
          content: `Support ticket subject: "${ticket.subject}"\n\nConversation:\n${conversationText}`,
        },
      ],
      max_tokens: 500,
    });

    const draft = completion.choices[0]?.message?.content ?? "I'd be happy to help with your request.";

    return NextResponse.json({ draft });
  } catch (err) {
    console.error("AI draft error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
