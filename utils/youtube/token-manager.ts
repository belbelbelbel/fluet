/**
 * YouTube Token Manager
 * Handles token retrieval and refresh for YouTube API operations
 */

import { GetUserByClerkId, GetLinkedAccount, UpdateLinkedAccountToken } from "@/utils/db/actions";
import { refreshAccessToken, getYouTubeConfig } from "./oauth";

export interface YouTubeTokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date | null;
  userId: number;
}

/**
 * Get valid YouTube tokens for a user
 * Automatically refreshes if expired
 */
export async function getYouTubeTokens(clerkUserId: string): Promise<YouTubeTokenData | null> {
  try {
    // Get user from database
    const user = await GetUserByClerkId(clerkUserId);
    if (!user) {
      return null;
    }

    // Get YouTube linked account
    const youtubeAccount = await GetLinkedAccount(user.id, "youtube");
    if (!youtubeAccount) {
      return null;
    }

    // Check if token needs refresh
    const now = new Date();
    const expiresAt = youtubeAccount.tokenExpiresAt ? new Date(youtubeAccount.tokenExpiresAt) : null;
    const expiresSoon = expiresAt && new Date(expiresAt.getTime() - 5 * 60 * 1000) <= now;
    const isExpired = expiresAt && expiresAt <= now;

    let accessToken = youtubeAccount.accessToken || "";

    // Refresh if expired or expiring soon
    if (isExpired || expiresSoon) {
      if (!youtubeAccount.refreshToken) {
        throw new Error("No refresh token available");
      }

      const config = getYouTubeConfig();
      const newTokens = await refreshAccessToken(youtubeAccount.refreshToken, config);
      
      // Update in database
      const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000);
      await UpdateLinkedAccountToken(
        user.id,
        "youtube",
        newTokens.access_token,
        newExpiresAt
      );

      accessToken = newTokens.access_token;
    }

    return {
      accessToken,
      refreshToken: youtubeAccount.refreshToken || "",
      expiresAt,
      userId: user.id,
    };
  } catch (error) {
    console.error("Error getting YouTube tokens:", error);
    return null;
  }
}

/**
 * Check if user has YouTube connected
 */
export async function isYouTubeConnected(clerkUserId: string): Promise<boolean> {
  const tokens = await getYouTubeTokens(clerkUserId);
  return tokens !== null;
}
