/**
 * Twitter OAuth Authorization Endpoint
 * Initiates OAuth flow and redirects to Twitter
 */

import { NextResponse } from "next/server";
import { getTwitterAuthorizationUrl, getTwitterConfig } from "@/utils/twitter/oauth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = getTwitterConfig();
    const authUrl = getTwitterAuthorizationUrl(config);

    // Redirect to Twitter OAuth
    return NextResponse.redirect(authUrl);
  } catch (error: unknown) {
    console.error("Twitter OAuth error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to initiate OAuth flow" },
      { status: 500 }
    );
  }
}
