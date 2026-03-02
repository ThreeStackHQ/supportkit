import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db, users, workspaces, subscriptions } from "@supportkit/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "@/lib/utils";

export const dynamic = "force-dynamic";

const signupSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    // Check if user exists
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const [user] = await db
      .insert(users)
      .values({ name, email, passwordHash })
      .returning();

    if (!user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    // Create default workspace
    const slug = email.split("@")[0]?.replace(/[^a-z0-9]/gi, "-").toLowerCase() ?? "workspace";
    const widgetKey = nanoid(32);

    await db.insert(workspaces).values({
      userId: user.id,
      name: `${name}'s Workspace`,
      slug: `${slug}-${nanoid(6)}`,
      widgetKey,
    });

    // Create free subscription
    await db.insert(subscriptions).values({
      userId: user.id,
      tier: "free",
      status: "active",
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
