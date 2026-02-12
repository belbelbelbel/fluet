/**
 * YouTube OAuth Authorization Endpoint
 * Initiates OAuth flow and redirects to Google
 */

import { NextResponse } from "next/server";
import { getAuthorizationUrl, getYouTubeConfig } from "@/utils/youtube/oauth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = getYouTubeConfig();
    const authUrl = getAuthorizationUrl(config);

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl);
  } catch (error: unknown) {
    console.error("YouTube OAuth error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to initiate OAuth flow" },
      { status: 500 }
    );
  }
}
