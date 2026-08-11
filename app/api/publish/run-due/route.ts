/**
 * Manually process the current user's due scheduled posts (test / prove path).
 * Same Twitter/IG behavior as cron, scoped to the signed-in user.
 */

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  GetUserByClerkId,
  GetPendingScheduledPosts,
  MarkScheduledPostAsPosted,
  GetLinkedAccount,
  CreateNotification,
  UpsertContentAnalyticsForPost,
} from "@/utils/db/actions";
import { postTweet } from "@/utils/twitter/post-service";
import { postPhotoToInstagram } from "@/utils/instagram/post-service";
import { fetchInstagramMediaMetrics } from "@/utils/instagram/metrics";
import { ensureTwitterAccessToken } from "@/utils/twitter/ensure-token";
import { fetchTweetMetrics } from "@/utils/twitter/metrics";
import { syncRecentSocialMetrics } from "@/utils/publish/sync-metrics";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  try {
    let clerkUserId: string | null = null;
    try {
      clerkUserId = (await auth())?.userId ?? null;
    } catch {
      /* ignore */
    }
    if (!clerkUserId) {
      try {
        clerkUserId = (await currentUser())?.id ?? null;
      } catch {
        /* ignore */
      }
    }
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await GetUserByClerkId(clerkUserId);
    if (!user?.id) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const pending = (await GetPendingScheduledPosts()).filter(
      (p) => p.userId === user.id
    );

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
      actions: [] as { id: number; platform: string; result: string }[],
    };

    for (const post of pending) {
      const platform = post.platform.toLowerCase();
      results.processed++;

      try {
        if (platform === "twitter") {
          const tokenResult = await ensureTwitterAccessToken(post.userId);
          if ("error" in tokenResult) {
            results.failed++;
            results.errors.push(`#${post.id}: ${tokenResult.error}`);
            results.actions.push({
              id: post.id,
              platform,
              result: tokenResult.error,
            });
            continue;
          }

          const postResult = await postTweet(
            tokenResult.accessToken,
            post.content
          );
          if (!postResult.success) {
            results.failed++;
            results.errors.push(`#${post.id}: ${postResult.error}`);
            results.actions.push({
              id: post.id,
              platform,
              result: postResult.error || "Tweet failed",
            });
            continue;
          }

          await MarkScheduledPostAsPosted(post.id, postResult.tweetId || null);
          if (postResult.tweetId) {
            const metrics = await fetchTweetMetrics(
              tokenResult.accessToken,
              postResult.tweetId
            );
            if (metrics.success) {
              await UpsertContentAnalyticsForPost({
                userId: post.userId,
                platform: "twitter",
                scheduledPostId: post.id,
                contentId: post.contentId,
                externalPostId: postResult.tweetId,
                ...metrics.metrics,
              });
            }
          }
          await CreateNotification(
            post.userId,
            "post_published",
            "Posted to Twitter",
            "Your scheduled tweet went live (manual run).",
            "/dashboard/schedule"
          ).catch(() => null);

          results.successful++;
          results.actions.push({
            id: post.id,
            platform,
            result: `Posted${postResult.tweetId ? ` (${postResult.tweetId})` : ""}`,
          });
          continue;
        }

        if (platform === "instagram") {
          const ig = await GetLinkedAccount(post.userId, "instagram");
          if (!ig?.accessToken || !ig.accountId) {
            results.skipped++;
            results.actions.push({
              id: post.id,
              platform,
              result: "Instagram not connected — skipped",
            });
            continue;
          }
          const imageUrlMatch = post.content.match(
            /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i
          );
          if (!imageUrlMatch) {
            results.skipped++;
            results.actions.push({
              id: post.id,
              platform,
              result: "No image URL in content — skipped",
            });
            continue;
          }
          const imageUrl = imageUrlMatch[0];
          const caption = post.content.replace(imageUrlMatch[0], "").trim();
          const postResult = await postPhotoToInstagram(
            ig.accessToken,
            ig.accountId,
            imageUrl,
            caption || "Posted via Revvy"
          );
          if (!postResult.success) {
            results.failed++;
            results.errors.push(`#${post.id}: ${postResult.error}`);
            results.actions.push({
              id: post.id,
              platform,
              result: postResult.error || "IG failed",
            });
            continue;
          }
          await MarkScheduledPostAsPosted(post.id, postResult.mediaId || null);
          if (postResult.mediaId) {
            const metrics = await fetchInstagramMediaMetrics(
              ig.accessToken,
              postResult.mediaId
            );
            if (metrics.success) {
              await UpsertContentAnalyticsForPost({
                userId: post.userId,
                platform: "instagram",
                scheduledPostId: post.id,
                contentId: post.contentId,
                externalPostId: postResult.mediaId,
                ...metrics.metrics,
              });
            }
          }
          results.successful++;
          results.actions.push({
            id: post.id,
            platform,
            result: `Posted${postResult.mediaId ? ` (${postResult.mediaId})` : ""}`,
          });
          continue;
        }

        results.skipped++;
        results.actions.push({
          id: post.id,
          platform,
          result: "Reminder-only platform — skipped",
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        results.failed++;
        results.errors.push(`#${post.id}: ${msg}`);
        results.actions.push({ id: post.id, platform, result: msg });
      }
    }

    const metricsSynced = await syncRecentSocialMetrics(10).catch(() => 0);

    return NextResponse.json({
      success: true,
      message:
        pending.length === 0
          ? "No due posts for your account"
          : `Processed ${results.processed} due post(s)`,
      ...results,
      metricsSynced,
    });
  } catch (error) {
    console.error("[Publish run-due]", error);
    return NextResponse.json(
      { error: "Failed to process due posts" },
      { status: 500 }
    );
  }
}
