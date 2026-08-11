import {
  GetLinkedAccount,
  GetPostedWithExternalIds,
  UpsertContentAnalyticsForPost,
} from "@/utils/db/actions";
import { ensureTwitterAccessToken } from "@/utils/twitter/ensure-token";
import { fetchTweetMetrics } from "@/utils/twitter/metrics";
import { fetchInstagramMediaMetrics } from "@/utils/instagram/metrics";

/** Refresh engagement for recently posted Twitter + Instagram rows. */
export async function syncRecentSocialMetrics(limit = 15): Promise<number> {
  let metricsSynced = 0;

  const recentTweets = await GetPostedWithExternalIds("twitter", limit);
  for (const tweetPost of recentTweets) {
    if (!tweetPost.externalPostId) continue;
    const tokenResult = await ensureTwitterAccessToken(tweetPost.userId);
    if ("error" in tokenResult) continue;
    const metrics = await fetchTweetMetrics(
      tokenResult.accessToken,
      tweetPost.externalPostId
    );
    if (!metrics.success) continue;
    await UpsertContentAnalyticsForPost({
      userId: tweetPost.userId,
      platform: "twitter",
      scheduledPostId: tweetPost.id,
      contentId: tweetPost.contentId,
      externalPostId: tweetPost.externalPostId,
      ...metrics.metrics,
    });
    metricsSynced++;
  }

  const recentIg = await GetPostedWithExternalIds("instagram", limit);
  for (const igPost of recentIg) {
    if (!igPost.externalPostId) continue;
    const igAccount = await GetLinkedAccount(igPost.userId, "instagram");
    if (!igAccount?.accessToken) continue;
    const metrics = await fetchInstagramMediaMetrics(
      igAccount.accessToken,
      igPost.externalPostId
    );
    if (!metrics.success) continue;
    await UpsertContentAnalyticsForPost({
      userId: igPost.userId,
      platform: "instagram",
      scheduledPostId: igPost.id,
      contentId: igPost.contentId,
      externalPostId: igPost.externalPostId,
      ...metrics.metrics,
    });
    metricsSynced++;
  }

  return metricsSynced;
}
