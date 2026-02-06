/**
 * YouTube OAuth Authorization Endpoint
 * Initiates OAuth flow and redirects to Google
 */

import { NextResponse } from "next/server";
import { getAuthorizationUrl, getYouTubeConfig } from "@/utils/youtube/oauth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const config = getYouTubeConfig();
    const authUrl = getAuthorizationUrl(config);

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error("YouTube OAuth error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate OAuth flow" },
      { status: 500 }
    );
  }
}
