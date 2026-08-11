/**
 * Cron Job: Post Scheduled Posts
 * 
 * This endpoint can be called by:
 * 1. Vercel Cron (daily on Hobby plan, or every minute on Pro plan)
 * 2. External cron service (e.g., cron-job.org) - every minute
 * 
 * It checks for scheduled posts that are due and posts them to:
 * - Twitter (tweets)
 * - Instagram (photos/videos)
 * 
 * Security: Protected by CRON_SECRET environment variable
 */

import { NextRequest, NextResponse } from "next/server";
import {
  GetPendingScheduledPosts,
  MarkScheduledPostAsPosted,
  GetLinkedAccount,
  CreateNotification,
  UpsertContentAnalyticsForPost,
} from "@/utils/db/actions";
import { postTweet } from "@/utils/twitter/post-service";
import { postPhotoToInstagram } from "@/utils/instagram/post-service";
import { fetchInstagramMediaMetrics } from "@/utils/instagram/metrics";
import { createCalendarEvent } from "@/utils/google-calendar/events";
import { refreshAccessToken } from "@/utils/google-calendar/oauth";
import { ensureTwitterAccessToken } from "@/utils/twitter/ensure-token";
import { fetchTweetMetrics } from "@/utils/twitter/metrics";
import { syncRecentSocialMetrics } from "@/utils/publish/sync-metrics";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 1 minute max for cron job

export async function GET(req: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    // Supports both Vercel Cron (authorization header) and external services (CRON_SECRET)
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const secretParam = req.nextUrl.searchParams.get("secret");

    // Vercel Cron automatically adds authorization header in production
    // External cron services should use ?secret=CRON_SECRET in the URL
    const isVercelCron = !!cronSecret && authHeader === `Bearer ${cronSecret}`;
    const isExternalCron = !!cronSecret && secretParam === cronSecret;

    // Production requires CRON_SECRET; local/dev may run without it for testing
    if (process.env.NODE_ENV === "production" && !cronSecret) {
      console.error("[Cron] CRON_SECRET is not set in production");
      return NextResponse.json(
        { error: "Cron not configured" },
        { status: 503 }
      );
    }

    if (cronSecret && !isVercelCron && !isExternalCron) {
      console.warn("[Cron] Unauthorized cron request");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const dryRun = req.nextUrl.searchParams.get("dryRun") === "1";
    console.log(
      `[Cron] Starting scheduled posts check${dryRun ? " (dryRun)" : ""}...`
    );

    // Get all pending scheduled posts
    const pendingPosts = await GetPendingScheduledPosts();

    console.log(`[Cron] Found ${pendingPosts.length} pending post(s) to process`);

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[],
      dryRun,
      preview: [] as { id: number; platform: string; action: string }[],
    };

    if (dryRun) {
      for (const post of pendingPosts) {
        const platform = post.platform.toLowerCase();
        let action = "skip";
        if (platform === "twitter") {
          const tokenResult = await ensureTwitterAccessToken(post.userId);
          action =
            "error" in tokenResult
              ? `twitter: ${tokenResult.error}`
              : "twitter: would post";
        } else if (platform === "instagram") {
          const ig = await GetLinkedAccount(post.userId, "instagram");
          const hasImage = /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i.test(
            post.content
          );
          action = !ig?.accessToken
            ? "instagram: not connected"
            : !hasImage
              ? "instagram: needs image URL"
              : "instagram: would post";
        } else if (platform === "linkedin" || platform === "tiktok") {
          action = `${platform}: reminder only`;
        } else {
          action = `${platform}: unsupported`;
        }
        results.preview.push({ id: post.id, platform: post.platform, action });
        results.processed++;
      }
      const metricsSynced = await syncRecentSocialMetrics(15).catch(() => 0);
      return NextResponse.json({
        success: true,
        message: `Dry run: ${pendingPosts.length} pending`,
        ...results,
        metricsSynced,
      });
    }

    // Process each pending post
    for (const post of pendingPosts) {
      try {
        const platform = post.platform.toLowerCase();
        const dueAgeMs =
          Date.now() - new Date(post.scheduledFor).getTime();
        // Only send "reminder" notifications once in the first ~20 minutes due
        // so a 15-min cron doesn't spam forever.
        const isFreshDue = dueAgeMs >= 0 && dueAgeMs < 20 * 60 * 1000;

        // Handle Twitter posts
        if (platform === "twitter") {
          const tokenResult = await ensureTwitterAccessToken(post.userId);

          if ("error" in tokenResult) {
            if (isFreshDue) {
              await CreateNotification(
                post.userId,
                "post_reminder",
                "Time to post on Twitter",
                `${tokenResult.error}. Open Schedule to copy and post manually.`,
                `/dashboard/schedule?reminder=${post.id}`
              );
            }
            console.log(
              `[Cron] Twitter reminder for post ${post.id}: ${tokenResult.error}`
            );
            results.processed++;
            continue;
          }

          const postResult = await postTweet(
            tokenResult.accessToken,
            post.content
          );

          if (postResult.success) {
            await MarkScheduledPostAsPosted(post.id, postResult.tweetId || null);
            if (postResult.tweetId) {
              try {
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
              } catch (metricsErr) {
                console.warn(`[Cron] Metrics sync skipped for ${post.id}:`, metricsErr);
              }
            }
            try {
              await CreateNotification(
                post.userId,
                "post_published",
                "Posted to Twitter",
                "Your scheduled tweet went live.",
                "/dashboard/schedule"
              );
            } catch {
              /* non-fatal */
            }
            console.log(`[Cron] Successfully posted tweet ${post.id} (Tweet ID: ${postResult.tweetId})`);
            results.successful++;
          } else {
            if (isFreshDue) {
              await CreateNotification(
                post.userId,
                "post_reminder",
                "Time to post on Twitter",
                `Auto-post failed (${postResult.error || "unknown"}). Copy and post manually.`,
                `/dashboard/schedule?reminder=${post.id}`
              );
            }
            const error = `Failed to post tweet ${post.id}: ${postResult.error}`;
            console.error(`[Cron] ${error}`);
            results.errors.push(error);
            results.failed++;
          }

          results.processed++;
          continue;
        }

        // Handle Instagram posts
        if (platform === "instagram") {
          // Get user's Instagram linked account
          const instagramAccount = await GetLinkedAccount(post.userId, "instagram");

          if (!instagramAccount || !instagramAccount.accessToken || !instagramAccount.accountId) {
            if (isFreshDue) {
              await CreateNotification(
                post.userId,
                "post_reminder",
                "Time to post on Instagram",
                `Your scheduled Instagram post is ready. Connect your Instagram account to auto-post, or click to copy and post manually.`,
                `/dashboard/schedule?reminder=${post.id}`
              );
            }
            console.log(`[Cron] Created reminder notification for Instagram post ${post.id} (no account connected)`);
            results.processed++;
            continue;
          }

          // For now, Instagram posts need an image URL
          // In the future, we can extract image from content or use a default
          // For text-only posts, we'll skip (Instagram requires media)
          const imageUrlMatch = post.content.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i);
          
          if (!imageUrlMatch) {
            if (isFreshDue) {
              await CreateNotification(
                post.userId,
                "post_reminder",
                "Time to post on Instagram",
                `Your scheduled Instagram post is ready. Add an image and post manually.`,
                `/dashboard/schedule?reminder=${post.id}`
              );
            }
            console.log(`[Cron] Created reminder notification for Instagram post ${post.id} (no image URL)`);
            results.processed++;
            continue;
          }

          const imageUrl = imageUrlMatch[0];
          const caption = post.content.replace(imageUrlMatch[0], "").trim();

          // Post the photo
          const postResult = await postPhotoToInstagram(
            instagramAccount.accessToken,
            instagramAccount.accountId,
            imageUrl,
            caption || "Posted via Fluet"
          );

          if (postResult.success) {
            await MarkScheduledPostAsPosted(post.id, postResult.mediaId || null);
            if (postResult.mediaId) {
              try {
                const metrics = await fetchInstagramMediaMetrics(
                  instagramAccount.accessToken,
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
              } catch (metricsErr) {
                console.warn(
                  `[Cron] Instagram metrics sync skipped for ${post.id}:`,
                  metricsErr
                );
              }
            }
            try {
              await CreateNotification(
                post.userId,
                "post_published",
                "Posted to Instagram",
                "Your scheduled Instagram post went live.",
                "/dashboard/schedule"
              );
            } catch {
              /* non-fatal */
            }
            console.log(
              `[Cron] Successfully posted Instagram post ${post.id} (Media ID: ${postResult.mediaId})`
            );
            results.successful++;
          } else {
            const error = `Failed to post Instagram ${post.id}: ${postResult.error}`;
            console.error(`[Cron] ${error}`);
            results.errors.push(error);
            results.failed++;
          }

          results.processed++;
          continue;
        }

        // Handle platforms that need manual posting (LinkedIn, TikTok, etc.)
        if (platform === "linkedin" || platform === "tiktok") {
          if (!isFreshDue) {
            results.processed++;
            continue;
          }

          // Check if user has Google Calendar connected
          const googleAccount = await GetLinkedAccount(post.userId, "google_calendar");
          
          if (googleAccount && googleAccount.accessToken) {
            try {
              // Get valid access token (refresh if needed)
              let accessToken = googleAccount.accessToken;
              
              // Check if token is expired and refresh if needed
              if (googleAccount.tokenExpiresAt && new Date(googleAccount.tokenExpiresAt) < new Date()) {
                if (googleAccount.refreshToken) {
                  const newTokens = await refreshAccessToken(googleAccount.refreshToken);
                  accessToken = newTokens.access_token;
                  
                  // Update token in database
                  const { UpdateLinkedAccountToken } = await import("@/utils/db/actions");
                  await UpdateLinkedAccountToken(
                    post.userId,
                    "google_calendar",
                    newTokens.access_token,
                    new Date(Date.now() + newTokens.expires_in * 1000)
                  );
                }
              }

              // Create Google Calendar event
              const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
              const calendarEvent = await createCalendarEvent(accessToken, {
                title: post.content.substring(0, 50) || `${platform} Post`,
                description: post.content,
                scheduledFor: new Date(post.scheduledFor),
                platform: post.platform,
                content: post.content,
                appLink: `${appUrl}/dashboard/schedule?reminder=${post.id}`,
              });

              console.log(`[Cron] Created Google Calendar reminder for ${platform} post ${post.id} (Event ID: ${calendarEvent.id})`);
              
              // Also create in-app notification as backup
              await CreateNotification(
                post.userId,
                "post_reminder",
                `Time to post on ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
                `Your scheduled post is ready. Check your Google Calendar for reminder, or click to copy and post manually.`,
                `/dashboard/schedule?reminder=${post.id}`
              );
            } catch (calendarError) {
              console.error(`[Cron] Failed to create Google Calendar event for post ${post.id}:`, calendarError);
              
              // Fallback to in-app notification only
              await CreateNotification(
                post.userId,
                "post_reminder",
                `Time to post on ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
                `Your scheduled post is ready. Click to copy and post manually.`,
                `/dashboard/schedule?reminder=${post.id}`
              );
            }
          } else {
            // No Google Calendar connected, use in-app notification only
            await CreateNotification(
              post.userId,
              "post_reminder",
              `Time to post on ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
              `Your scheduled post is ready. Connect Google Calendar in Settings to get email reminders, or click to copy and post manually.`,
              `/dashboard/schedule?reminder=${post.id}`
            );
          }
          
          console.log(`[Cron] Created reminder for ${platform} post ${post.id}`);
          results.processed++;
          continue;
        }

        // Skip unsupported platforms
        console.log(`[Cron] Skipping ${platform} post (not yet supported)`);
        results.processed++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`[Cron] Error processing post ${post.id}:`, errorMessage);
        results.errors.push(`Post ${post.id}: ${errorMessage}`);
        results.failed++;
        results.processed++;
      }
    }

    // Always refresh metrics (even when there were zero due posts)
    let metricsSynced = 0;
    try {
      metricsSynced = await syncRecentSocialMetrics(15);
    } catch (syncErr) {
      console.warn("[Cron] Metrics sync batch failed:", syncErr);
    }

    console.log(
      `[Cron] Completed: ${results.successful} successful, ${results.failed} failed, metricsSynced=${metricsSynced}`
    );

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} post(s)`,
      ...results,
      metricsSynced,
    });
  } catch (error) {
    console.error("[Cron] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
