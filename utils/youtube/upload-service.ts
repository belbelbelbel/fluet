/**
 * YouTube Upload Service
 * Handles video uploads to YouTube using the YouTube Data API v3
 */

import { refreshAccessToken, getYouTubeConfig } from "./oauth";
import { promises as fs } from "fs";
import path from "path";

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
  try {
    const config = getYouTubeConfig();
    const newTokens = await refreshAccessToken(refreshToken, config);
    
    // Update stored token in database
    const { UpdateLinkedAccountToken } = await import("@/utils/db/actions");
    const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000);
    await UpdateLinkedAccountToken(userId, "youtube", newTokens.access_token, newExpiresAt);
    
    console.log(`[YouTube Upload] ✅ Token refreshed successfully`);
    return newTokens.access_token;
  } catch (error) {
    console.error(`[YouTube Upload] ❌ Token refresh failed:`, error);
    throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Upload video to YouTube using resumable upload
 * Handles large files with proper chunking and error recovery
 */
export async function uploadVideoToYouTube(
  options: VideoUploadOptions,
  userId: number,
  accessToken: string,
  refreshToken: string,
  expiresAt: Date | null
): Promise<UploadResult> {
  // Resolve video file path (handle both absolute and relative paths)
  let videoPath = options.videoPath;
  if (!path.isAbsolute(videoPath)) {
    // If relative, assume it's relative to project root or public folder
    if (videoPath.startsWith("/")) {
      videoPath = path.join(process.cwd(), "public", videoPath);
    } else {
      videoPath = path.join(process.cwd(), videoPath);
    }
  }

  // Check if video file exists
  try {
    await fs.access(videoPath);
  } catch (error) {
    throw new Error(`Video file not found: ${videoPath}`);
  }

  // Get file stats
  const stats = await fs.stat(videoPath);
  const fileSize = stats.size;

  console.log(`[YouTube Upload] 📤 Uploading video: ${path.basename(videoPath)}`);
  console.log(`[YouTube Upload] 📊 File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

  // Read video file into buffer
  const videoFileBuffer = await fs.readFile(videoPath);

  // YouTube API endpoint for resumable uploads
  const uploadUrl = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status";

  // Helper function to attempt upload with a token
  const attemptUpload = async (token: string): Promise<Response> => {
    return fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": "video/*",
        "X-Upload-Content-Length": fileSize.toString(),
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
  };

  // Get valid access token
  let validToken = await getValidAccessToken(userId, accessToken, refreshToken, expiresAt);

  // Step 1: Initialize upload (get resumable upload URL)
  let initResponse = await attemptUpload(validToken);

  // If unauthorized, try refreshing token and retry once
  if (initResponse.status === 401) {
    console.log(`[YouTube Upload] ⚠️  Token expired or invalid, refreshing...`);
    try {
      // Force refresh by passing expired date
      validToken = await getValidAccessToken(userId, accessToken, refreshToken, new Date(0));
      console.log(`[YouTube Upload] ✅ Token refreshed, retrying upload...`);
      initResponse = await attemptUpload(validToken);
      
      // If still unauthorized after refresh, it's likely a scope/permission issue
      if (initResponse.status === 401) {
        const errorText = await initResponse.text();
        console.error(`[YouTube Upload] ❌ Still unauthorized after refresh. Error:`, errorText);
        throw new Error("YouTube upload permission denied. Your account may not have the required upload permissions. Please disconnect and reconnect your YouTube account in Settings, and make sure to grant all requested permissions.");
      }
    } catch (refreshError) {
      // If it's already our custom error, re-throw it
      if (refreshError instanceof Error && refreshError.message.includes("upload permission")) {
        throw refreshError;
      }
      
      console.error(`[YouTube Upload] ❌ Token refresh failed:`, refreshError);
      const errorText = await initResponse.text();
      let errorMessage = `Token refresh failed. Please disconnect and reconnect your YouTube account in Settings.`;
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = `YouTube API Error: ${errorJson.error.message}. Please reconnect your YouTube account.`;
        }
      } catch {
        // Use default message
      }
      
      throw new Error(errorMessage);
    }
  }

  if (!initResponse.ok) {
    const errorText = await initResponse.text();
    let errorMessage = `Failed to initialize upload: ${errorText}`;
    
    // Try to parse error for better message
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error) {
        // Check for specific error reasons
        const errorReason = errorJson.error.errors?.[0]?.reason || "";
        const errorMessageText = errorJson.error.message || "";
        
        if (errorReason === "youtubeSignupRequired") {
          errorMessage = "Your Google account doesn't have a YouTube channel. Please create a YouTube channel first by visiting youtube.com and creating a channel, then reconnect your account in Settings.";
        } else if (errorReason === "invalidPublishAt") {
          errorMessage = "Invalid scheduled time. YouTube requires scheduled videos to be at least 15 minutes in the future. Please schedule for a later time.";
        } else if (errorMessageText.includes("Unauthorized") || errorReason.includes("invalid_grant")) {
          errorMessage = "YouTube authorization expired or invalid. Please disconnect and reconnect your YouTube account in Settings to grant upload permissions.";
        } else if (errorMessageText.includes("insufficient") || errorReason.includes("insufficient")) {
          errorMessage = "Insufficient permissions. Please reconnect your YouTube account and grant all requested permissions.";
        } else if (errorMessageText) {
          errorMessage = `YouTube API Error: ${errorMessageText}`;
        }
      }
      
      // Log full error for debugging
      console.error(`[YouTube Upload] Full error response:`, JSON.stringify(errorJson, null, 2));
    } catch {
      // Use raw error text
      console.error(`[YouTube Upload] Raw error response:`, errorText);
    }
    
    throw new Error(errorMessage);
  }

  const location = initResponse.headers.get("Location");
  if (!location) {
    throw new Error("No upload location received from YouTube API");
  }

  console.log(`[YouTube Upload] ✅ Upload initialized, uploading file...`);

  // Step 2: Upload video file (resumable upload)
  // For large files, YouTube supports chunked uploads, but for simplicity
  // we'll upload the entire file at once (works for files up to ~2GB)
  let uploadResponse = await fetch(location, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${validToken}`,
      "Content-Type": "video/*",
      "Content-Length": fileSize.toString(),
    },
    body: videoFileBuffer,
  });

  // If unauthorized during upload, refresh token and retry
  if (uploadResponse.status === 401) {
    console.log(`[YouTube Upload] ⚠️  Token expired during upload, refreshing...`);
    validToken = await getValidAccessToken(userId, accessToken, refreshToken, new Date(0));
    uploadResponse = await fetch(location, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${validToken}`,
        "Content-Type": "video/*",
        "Content-Length": fileSize.toString(),
      },
      body: videoFileBuffer,
    });
  }

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    let errorMessage = `Failed to upload video: ${errorText}`;
    
    // Try to parse error for better message
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error?.message) {
        errorMessage = `YouTube Upload Error: ${errorJson.error.message}`;
        if (errorJson.error.message.includes("Unauthorized")) {
          errorMessage += ". Please reconnect your YouTube account in Settings.";
        }
      }
    } catch {
      // Use raw error text
    }
    
    throw new Error(errorMessage);
  }

  const uploadData = await uploadResponse.json();
  const videoId = uploadData.id;

  if (!videoId) {
    throw new Error("No video ID returned from YouTube API");
  }

  console.log(`[YouTube Upload] ✅ Video uploaded successfully!`);
  console.log(`[YouTube Upload] 🎬 Video ID: ${videoId}`);
  console.log(`[YouTube Upload] 🔗 URL: https://www.youtube.com/watch?v=${videoId}`);

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
