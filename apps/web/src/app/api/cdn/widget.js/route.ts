import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Try to serve the built widget bundle
    const widgetPath = path.join(process.cwd(), "..", "..", "packages", "widget", "dist", "widget.js");
    const content = await readFile(widgetPath, "utf-8");

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    // Return inline fallback widget
    const fallback = `/* SupportKit Widget - Build the widget package first */
(function(){console.warn("SupportKit: widget bundle not built. Run: pnpm --filter @supportkit/widget build");})();`;

    return new NextResponse(fallback, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
