/**
 * Twitter Post Service
 * Handles posting tweets to Twitter API
 */

interface TwitterPostResult {
  success: boolean;
  tweetId?: string;
  error?: string;
}

/**
 * Post a tweet to Twitter using OAuth 2.0
 * @param accessToken - Twitter OAuth access token
 * @param content - Tweet content (max 280 characters)
 * @returns Result with tweet ID or error
 */
export async function postTweet(
  accessToken: string,
  content: string
): Promise<TwitterPostResult> {
  try {
    // Validate content length
    if (content.length > 280) {
      return {
        success: false,
        error: "Tweet content exceeds 280 characters",
      };
    }

    if (content.trim().length === 0) {
      return {
        success: false,
        error: "Tweet content cannot be empty",
      };
    }

    // Post tweet using Twitter API v2
    const response = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: content,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific Twitter API errors
      const errorMessage = data.detail || data.title || "Failed to post tweet";
      
      if (response.status === 401) {
        return {
          success: false,
          error: "Twitter authentication failed. Please reconnect your Twitter account.",
        };
      }

      if (response.status === 403) {
        return {
          success: false,
          error: "Twitter API access denied. Please check your API permissions.",
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          error: "Twitter API rate limit exceeded. Please try again later.",
        };
      }

      return {
        success: false,
        error: `Twitter API error: ${errorMessage}`,
      };
    }

    // Success - return tweet ID
    return {
      success: true,
      tweetId: data.data?.id,
    };
  } catch (error) {
    console.error("[Twitter Post Service] Error posting tweet:", error);
    
    if (error instanceof Error) {
      return {
        success: false,
        error: `Failed to post tweet: ${error.message}`,
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred while posting the tweet",
    };
  }
}

/**
 * Verify Twitter access token is valid
 * @param accessToken - Twitter OAuth access token
 * @returns True if token is valid, false otherwise
 */
export async function verifyTwitterToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.twitter.com/2/users/me", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error("[Twitter Post Service] Error verifying token:", error);
    return false;
  }
}
