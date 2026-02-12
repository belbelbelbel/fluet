/**
 * Cron Job: Post Scheduled Tweets
 * 
 * This endpoint runs every 1 minute via Vercel Cron
 * It checks for scheduled posts that are due and posts them to Twitter
 * 
 * Security: Protected by Vercel Cron secret header
 */

import { NextRequest, NextResponse } from "next/server";
import { GetPendingScheduledPosts, MarkScheduledPostAsPosted, GetLinkedAccount } from "@/utils/db/actions";
import { postTweet } from "@/utils/twitter/post-service";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 1 minute max for cron job

export async function GET(req: NextRequest) {
  try {
    // Verify this is a legitimate cron request from Vercel
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // In production, Vercel automatically adds the authorization header
    // For local testing, you can set CRON_SECRET in .env.local
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
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
        // Only process Twitter posts for now
        // Other platforms can be added later
        if (post.platform.toLowerCase() !== "twitter") {
          console.log(`[Cron] Skipping ${post.platform} post (not yet supported)`);
          continue;
        }

        // Get user's Twitter linked account
        const twitterAccount = await GetLinkedAccount(post.userId, "twitter");

        if (!twitterAccount || !twitterAccount.accessToken) {
          const error = `No Twitter account connected for user ${post.userId}`;
          console.error(`[Cron] ${error}`);
          results.errors.push(error);
          results.failed++;
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
          
          // Don't mark as posted if it failed
          // The cron will retry on the next run
        }

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
