/**
 * YouTube Upload Service
 * Handles video uploads to YouTube using the YouTube Data API v3
 */

import { refreshAccessToken, getYouTubeConfig } from "./oauth";

export interface VideoUploadOptions {
  videoPath: string; // Path to video file
  title: string;
  description: string;
  tags: string[];
  category: string; // YouTube category ID
  privacyStatus: "public" | "unlisted" | "private";
  scheduledPublishTime?: string; // ISO 8601 format
  thumbnailPath?: string; // Optional thumbnail
}

export interface UploadResult {
  videoId: string;
  videoUrl: string;
  status: "uploaded" | "scheduled";
}

/**
 * Get valid access token (refresh if needed)
 */
export async function getValidAccessToken(
  userId: number,
  accessToken: string,
  refreshToken: string,
  expiresAt: Date | null
): Promise<string> {
  // Check if token is expired or expires soon (within 5 minutes)
  const now = new Date();
  const expiresSoon = expiresAt && new Date(expiresAt.getTime() - 5 * 60 * 1000) <= now;
  const isExpired = expiresAt && expiresAt <= now;

  if (!isExpired && !expiresSoon) {
    return accessToken;
  }

  // Token expired or expiring soon, refresh it
  const config = getYouTubeConfig();
  const newTokens = await refreshAccessToken(refreshToken, config);
  
  // Update stored token in database
  const { UpdateLinkedAccountToken } = await import("@/utils/db/actions");
  const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000);
  await UpdateLinkedAccountToken(userId, "youtube", newTokens.access_token, newExpiresAt);
  
  return newTokens.access_token;
}

/**
 * Upload video to YouTube
 */
export async function uploadVideoToYouTube(
  options: VideoUploadOptions,
  userId: number,
  accessToken: string,
  refreshToken: string,
  expiresAt: Date | null
): Promise<UploadResult> {
  // Get valid access token
  const validToken = await getValidAccessToken(userId, accessToken, refreshToken, expiresAt);

  // Read video file
  // In Node.js, you'd use fs to read the file
  // For now, this is a placeholder structure

  // YouTube API endpoint for uploads
  const uploadUrl = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status";

  // Step 1: Initialize upload (get upload URL)
  const initResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${validToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      snippet: {
        title: options.title,
        description: options.description,
        tags: options.tags,
        categoryId: options.category,
      },
      status: {
        privacyStatus: options.privacyStatus,
        ...(options.scheduledPublishTime && {
          publishAt: options.scheduledPublishTime,
        }),
      },
    }),
  });

  if (!initResponse.ok) {
    const error = await initResponse.text();
    throw new Error(`Failed to initialize upload: ${error}`);
  }

  const location = initResponse.headers.get("Location");
  if (!location) {
    throw new Error("No upload location received");
  }

  // Step 2: Upload video file
  // In production, you'd read the file and upload it
  // This is a placeholder - actual implementation requires file handling
  const uploadResponse = await fetch(location, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${validToken}`,
      "Content-Type": "video/*",
    },
    // body: videoFileBuffer, // Actual file data
  });

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();
    throw new Error(`Failed to upload video: ${error}`);
  }

  const uploadData = await uploadResponse.json();
  const videoId = uploadData.id;

  return {
    videoId,
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    status: options.scheduledPublishTime ? "scheduled" : "uploaded",
  };
}

/**
 * Get YouTube category ID by name
 */
export function getCategoryId(categoryName: string): string {
  const categories: Record<string, string> = {
    Music: "10",
    Entertainment: "24",
    Gaming: "20",
    Sports: "17",
    Education: "27",
    Science: "28",
    Technology: "28",
    News: "25",
    Howto: "26",
    People: "22",
    Comedy: "23",
    Travel: "19",
    Autos: "2",
    Pets: "15",
  };

  return categories[categoryName] || "22"; // Default to People
}
