/**
 * YouTube OAuth 2.0 Authentication
 * Handles OAuth flow and token management
 */

export interface YouTubeTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface YouTubeAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

// YouTube API scopes needed for upload and management
export const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload", // Upload videos
  "https://www.googleapis.com/auth/youtube", // Manage YouTube account
  "https://www.googleapis.com/auth/youtube.readonly", // Read analytics
];

/**
 * Generate OAuth authorization URL
 */
export function getAuthorizationUrl(config: YouTubeAuthConfig): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    access_type: "offline", // Required to get refresh token
    prompt: "consent", // Force consent screen to get refresh token
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForTokens(
  code: string,
  config: YouTubeAuthConfig
): Promise<YouTubeTokens> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
  config: YouTubeAuthConfig
): Promise<{ access_token: string; expires_in: number }> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  return response.json();
}

/**
 * Get YouTube API configuration from environment
 */
export function getYouTubeConfig(): YouTubeAuthConfig {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI || "http://localhost:3000/oauth2callback";

  if (!clientId || !clientSecret) {
    throw new Error("YouTube API credentials not configured. Please set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET in .env.local");
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    scopes: YOUTUBE_SCOPES,
  };
}
