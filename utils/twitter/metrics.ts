/**
 * Fetch public metrics for a tweet (requires tweet.read).
 */

export type TweetMetrics = {
  views: number;
  likes: number;
  shares: number;
  comments: number;
};

export async function fetchTweetMetrics(
  accessToken: string,
  tweetId: string
): Promise<{ success: true; metrics: TweetMetrics } | { success: false; error: string }> {
  try {
    const url = new URL(`https://api.twitter.com/2/tweets/${tweetId}`);
    url.searchParams.set("tweet.fields", "public_metrics");

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || data.title || "Failed to fetch tweet metrics",
      };
    }

    const m = data.data?.public_metrics || {};
    return {
      success: true,
      metrics: {
        views: Number(m.impression_count || 0),
        likes: Number(m.like_count || 0),
        shares: Number(m.retweet_count || 0) + Number(m.quote_count || 0),
        comments: Number(m.reply_count || 0),
      },
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Metrics fetch failed",
    };
  }
}
