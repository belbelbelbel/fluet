/**
 * Fetch public metrics for an Instagram media object.
 */

export type InstagramMediaMetrics = {
  views: number;
  likes: number;
  shares: number;
  comments: number;
};

export async function fetchInstagramMediaMetrics(
  accessToken: string,
  mediaId: string
): Promise<
  { success: true; metrics: InstagramMediaMetrics } | { success: false; error: string }
> {
  try {
    const mediaUrl = new URL(`https://graph.facebook.com/v18.0/${mediaId}`);
    mediaUrl.searchParams.set("fields", "like_count,comments_count");
    mediaUrl.searchParams.set("access_token", accessToken);

    const mediaRes = await fetch(mediaUrl.toString());
    const mediaData = await mediaRes.json();

    if (!mediaRes.ok) {
      return {
        success: false,
        error:
          mediaData.error?.message ||
          mediaData.error?.error_user_msg ||
          "Failed to fetch Instagram media metrics",
      };
    }

    let impressions = 0;
    try {
      const insightsUrl = new URL(
        `https://graph.facebook.com/v18.0/${mediaId}/insights`
      );
      insightsUrl.searchParams.set("metric", "impressions,reach");
      insightsUrl.searchParams.set("access_token", accessToken);
      const insightsRes = await fetch(insightsUrl.toString());
      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        const rows = Array.isArray(insightsData.data) ? insightsData.data : [];
        for (const row of rows) {
          if (row.name === "impressions" || row.name === "reach") {
            const val = Number(row.values?.[0]?.value || 0);
            if (val > impressions) impressions = val;
          }
        }
      }
    } catch {
      /* insights optional */
    }

    const likes = Number(mediaData.like_count || 0);
    const comments = Number(mediaData.comments_count || 0);

    return {
      success: true,
      metrics: {
        views: impressions,
        likes,
        shares: 0,
        comments,
      },
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Instagram metrics fetch failed",
    };
  }
}
