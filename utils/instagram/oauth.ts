/**
 * Instagram/Facebook OAuth 2.0 Authentication
 * Handles OAuth flow and token management via Meta Graph API
 * 
 * Note: Instagram API requires Facebook Page connection
 */

export interface InstagramTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface InstagramAuthConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
  scopes: string[];
}

// Instagram Graph API scopes needed for posting
export const INSTAGRAM_SCOPES = [
  "instagram_basic", // Basic Instagram account info
  "instagram_content_publish", // Post photos/videos
  "pages_read_engagement", // Read Facebook Page engagement
  "pages_show_list", // List Facebook Pages
  "business_management", // Manage business assets
];

/**
 * Generate OAuth authorization URL
 */
export function getInstagramAuthorizationUrl(config: InstagramAuthConfig): string {
  const params = new URLSearchParams({
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(","),
    response_type: "code",
    state: "instagram_oauth_state", // CSRF protection
  });

  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForTokens(
  code: string,
  config: InstagramAuthConfig
): Promise<InstagramTokens> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?` +
    `client_id=${config.appId}` +
    `&redirect_uri=${encodeURIComponent(config.redirectUri)}` +
    `&client_secret=${config.appSecret}` +
    `&code=${code}`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Get long-lived access token (60 days instead of 1-2 hours)
 */
export async function getLongLivedToken(
  shortLivedToken: string,
  config: InstagramAuthConfig
): Promise<{ access_token: string; expires_in: number }> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?` +
    `grant_type=fb_exchange_token` +
    `&client_id=${config.appId}` +
    `&client_secret=${config.appSecret}` +
    `&fb_exchange_token=${shortLivedToken}`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Get user's Facebook Pages (required for Instagram)
 */
export async function getUserPages(accessToken: string): Promise<any[]> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch pages: ${error}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Get Instagram Business Account connected to Facebook Page
 */
export async function getInstagramAccount(
  pageId: string,
  accessToken: string
): Promise<any> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}?` +
    `fields=instagram_business_account&` +
    `access_token=${accessToken}`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch Instagram account: ${error}`);
  }

  return response.json();
}

/**
 * Get Instagram API configuration from environment
 */
export function getInstagramConfig(): InstagramAuthConfig {
  const appId = process.env.FACEBOOK_APP_ID || process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET || process.env.INSTAGRAM_APP_SECRET;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || "http://localhost:3000/oauth2callback";

  if (!appId || !appSecret) {
    throw new Error(
      "Instagram/Facebook API credentials not configured. " +
      "Please set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in .env.local"
    );
  }

  return {
    appId,
    appSecret,
    redirectUri,
    scopes: INSTAGRAM_SCOPES,
  };
}
