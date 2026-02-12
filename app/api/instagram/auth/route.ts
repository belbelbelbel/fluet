/**
 * Instagram OAuth Authorization Endpoint
 * Initiates OAuth flow and redirects to Facebook (Meta)
 */

import { NextResponse } from "next/server";
import { getInstagramAuthorizationUrl, getInstagramConfig } from "@/utils/instagram/oauth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = getInstagramConfig();
    const authUrl = getInstagramAuthorizationUrl(config);

    // Redirect to Facebook OAuth (which handles Instagram)
    return NextResponse.redirect(authUrl);
  } catch (error: unknown) {
    console.error("Instagram OAuth error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to initiate OAuth flow" },
      { status: 500 }
    );
  }
}
