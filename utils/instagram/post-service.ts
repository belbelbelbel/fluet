/**
 * Instagram Post Service
 * Handles posting photos and videos to Instagram using Graph API
 */

interface InstagramPostResult {
  success: boolean;
  mediaId?: string;
  error?: string;
}

/**
 * Upload photo to Instagram
 * @param accessToken - Instagram/Facebook access token
 * @param instagramAccountId - Instagram Business Account ID
 * @param imageUrl - URL of the image to post
 * @param caption - Caption for the post
 * @returns Result with media ID or error
 */
export async function postPhotoToInstagram(
  accessToken: string,
  instagramAccountId: string,
  imageUrl: string,
  caption: string
): Promise<InstagramPostResult> {
  try {
    // Step 1: Create media container
    const createResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}/media?` +
      `image_url=${encodeURIComponent(imageUrl)}` +
      `&caption=${encodeURIComponent(caption)}` +
      `&access_token=${accessToken}`,
      {
        method: "POST",
      }
    );

    const createData = await createResponse.json();

    if (!createResponse.ok) {
      const errorMessage = createData.error?.message || "Failed to create media container";
      
      if (createResponse.status === 401) {
        return {
          success: false,
          error: "Instagram authentication failed. Please reconnect your Instagram account.",
        };
      }

      if (createResponse.status === 403) {
        return {
          success: false,
          error: "Instagram API access denied. Please check your API permissions.",
        };
      }

      return {
        success: false,
        error: `Instagram API error: ${errorMessage}`,
      };
    }

    const creationId = createData.id;
    if (!creationId) {
      return {
        success: false,
        error: "Failed to get media creation ID",
      };
    }

    // Step 2: Publish the media
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish?` +
      `creation_id=${creationId}` +
      `&access_token=${accessToken}`,
      {
        method: "POST",
      }
    );

    const publishData = await publishResponse.json();

    if (!publishResponse.ok) {
      const errorMessage = publishData.error?.message || "Failed to publish media";
      return {
        success: false,
        error: `Instagram publish error: ${errorMessage}`,
      };
    }

    return {
      success: true,
      mediaId: publishData.id,
    };
  } catch (error) {
    console.error("[Instagram Post Service] Error posting photo:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: `Failed to post photo: ${error.message}`,
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred while posting the photo",
    };
  }
}

/**
 * Upload video to Instagram (requires 2-step process)
 * @param accessToken - Instagram/Facebook access token
 * @param instagramAccountId - Instagram Business Account ID
 * @param videoUrl - URL of the video to post
 * @param caption - Caption for the post
 * @param thumbnailUrl - Optional thumbnail URL
 * @returns Result with media ID or error
 */
export async function postVideoToInstagram(
  accessToken: string,
  instagramAccountId: string,
  videoUrl: string,
  caption: string,
  thumbnailUrl?: string
): Promise<InstagramPostResult> {
  try {
    // Step 1: Create media container
    const createParams = new URLSearchParams({
      media_type: "REELS", // or "VIDEO" for regular posts
      video_url: videoUrl,
      caption: caption,
      access_token: accessToken,
    });

    if (thumbnailUrl) {
      createParams.append("thumb_offset", "0");
      createParams.append("cover_url", thumbnailUrl);
    }

    const createResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}/media?${createParams.toString()}`,
      {
        method: "POST",
      }
    );

    const createData = await createResponse.json();

    if (!createResponse.ok) {
      const errorMessage = createData.error?.message || "Failed to create media container";
      return {
        success: false,
        error: `Instagram API error: ${errorMessage}`,
      };
    }

    const creationId = createData.id;
    if (!creationId) {
      return {
        success: false,
        error: "Failed to get media creation ID",
      };
    }

    // Step 2: Check status (videos need processing time)
    let status = "IN_PROGRESS";
    let attempts = 0;
    const maxAttempts = 30; // Wait up to 5 minutes (10s intervals)

    while (status === "IN_PROGRESS" && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds

      const statusResponse = await fetch(
        `https://graph.facebook.com/v18.0/${creationId}?` +
        `fields=status_code&` +
        `access_token=${accessToken}`
      );

      const statusData = await statusResponse.json();
      status = statusData.status_code || "IN_PROGRESS";
      attempts++;

      if (status === "ERROR") {
        return {
          success: false,
          error: "Video processing failed",
        };
      }
    }

    if (status !== "FINISHED") {
      return {
        success: false,
        error: "Video processing timed out. Please try again.",
      };
    }

    // Step 3: Publish the video
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish?` +
      `creation_id=${creationId}` +
      `&access_token=${accessToken}`,
      {
        method: "POST",
      }
    );

    const publishData = await publishResponse.json();

    if (!publishResponse.ok) {
      const errorMessage = publishData.error?.message || "Failed to publish video";
      return {
        success: false,
        error: `Instagram publish error: ${errorMessage}`,
      };
    }

    return {
      success: true,
      mediaId: publishData.id,
    };
  } catch (error) {
    console.error("[Instagram Post Service] Error posting video:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: `Failed to post video: ${error.message}`,
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred while posting the video",
    };
  }
}

/**
 * Verify Instagram access token is valid
 * @param accessToken - Instagram/Facebook access token
 * @returns True if token is valid, false otherwise
 */
export async function verifyInstagramToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`
    );

    return response.ok;
  } catch (error) {
    console.error("[Instagram Post Service] Error verifying token:", error);
    return false;
  }
}
