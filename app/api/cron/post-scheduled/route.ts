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
import { GetPendingScheduledPosts, MarkScheduledPostAsPosted, GetLinkedAccount, CreateNotification } from "@/utils/db/actions";
import { postTweet } from "@/utils/twitter/post-service";
import { postPhotoToInstagram } from "@/utils/instagram/post-service";
import { createCalendarEvent } from "@/utils/google-calendar/events";
import { refreshAccessToken } from "@/utils/google-calendar/oauth";

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
    const isVercelCron = authHeader === `Bearer ${cronSecret}`;
    const isExternalCron = cronSecret && secretParam === cronSecret;

    if (cronSecret && !isVercelCron && !isExternalCron) {
      console.warn("[Cron] Unauthorized cron request");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[Cron] Starting scheduled posts check...");

    // Get all pending scheduled posts
    const pendingPosts = await GetPendingScheduledPosts();

    if (pendingPosts.length === 0) {
      console.log("[Cron] No pending posts to process");
      return NextResponse.json({
        success: true,
        message: "No pending posts",
        processed: 0,
      });
    }

    console.log(`[Cron] Found ${pendingPosts.length} pending post(s) to process`);

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each pending post
    for (const post of pendingPosts) {
      try {
        const platform = post.platform.toLowerCase();

        // Handle Twitter posts
        if (platform === "twitter") {
          // Get user's Twitter linked account
          const twitterAccount = await GetLinkedAccount(post.userId, "twitter");

          if (!twitterAccount || !twitterAccount.accessToken) {
            // Create a reminder notification instead of failing
            await CreateNotification(
              post.userId,
              "post_reminder",
              "Time to post on Twitter",
              `Your scheduled tweet is ready. Connect your Twitter account to auto-post, or click to copy and post manually.`,
              `/dashboard/schedule?reminder=${post.id}`
            );
            console.log(`[Cron] Created reminder notification for Twitter post ${post.id} (no account connected)`);
            results.processed++;
            continue;
          }

          // Post the tweet
          const postResult = await postTweet(
            twitterAccount.accessToken,
            post.content
          );

          if (postResult.success) {
            // Mark as posted
            await MarkScheduledPostAsPosted(post.id);
            console.log(`[Cron] Successfully posted tweet ${post.id} (Tweet ID: ${postResult.tweetId})`);
            results.successful++;
          } else {
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
            // Create a reminder notification instead of failing
            await CreateNotification(
              post.userId,
              "post_reminder",
              "Time to post on Instagram",
              `Your scheduled Instagram post is ready. Connect your Instagram account to auto-post, or click to copy and post manually.`,
              `/dashboard/schedule?reminder=${post.id}`
            );
            console.log(`[Cron] Created reminder notification for Instagram post ${post.id} (no account connected)`);
            results.processed++;
            continue;
          }

          // For now, Instagram posts need an image URL
          // In the future, we can extract image from content or use a default
          // For text-only posts, we'll skip (Instagram requires media)
          const imageUrlMatch = post.content.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i);
          
          if (!imageUrlMatch) {
            // Create a reminder notification for manual posting
            await CreateNotification(
              post.userId,
              "post_reminder",
              "Time to post on Instagram",
              `Your scheduled Instagram post is ready. Add an image and post manually.`,
              `/dashboard/schedule?reminder=${post.id}`
            );
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
            // Mark as posted
            await MarkScheduledPostAsPosted(post.id);
            console.log(`[Cron] Successfully posted Instagram post ${post.id} (Media ID: ${postResult.mediaId})`);
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

    console.log(`[Cron] Completed: ${results.successful} successful, ${results.failed} failed`);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} post(s)`,
      ...results,
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
