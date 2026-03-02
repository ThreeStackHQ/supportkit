import { NextRequest, NextResponse } from "next/server";
import { db, workspaces } from "@supportkit/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "Widget key required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const [workspace] = await db
      .select({
        name: workspaces.name,
        primaryColor: workspaces.primaryColor,
      })
      .from(workspaces)
      .where(eq(workspaces.widgetKey, key))
      .limit(1);

    if (!workspace) {
      return NextResponse.json(
        { error: "Invalid widget key" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        workspaceName: workspace.name,
        primaryColor: workspace.primaryColor,
        greeting: `Hi! Welcome to ${workspace.name}. How can we help you today?`,
      },
      { headers: corsHeaders }
    );
  } catch (err) {
    console.error("Widget config error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
