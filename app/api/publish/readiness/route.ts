/**
 * Publish readiness. Can this user auto-post right now?
 * Used from Settings to prove the Twitter/IG loop without waiting on cron.
 */

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  GetUserByClerkId,
  GetLinkedAccount,
  GetPendingScheduledPosts,
} from "@/utils/db/actions";
import { ensureTwitterAccessToken } from "@/utils/twitter/ensure-token";
import { verifyTwitterToken } from "@/utils/twitter/post-service";

export const dynamic = "force-dynamic";

export async function GET() {
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

    const cronSecretSet = !!process.env.CRON_SECRET;
    const twitterEnv =
      !!process.env.TWITTER_CLIENT_ID && !!process.env.TWITTER_CLIENT_SECRET;
    const igEnv =
      !!process.env.FACEBOOK_APP_ID && !!process.env.FACEBOOK_APP_SECRET;

    // Twitter
    const twitter: {
      connected: boolean;
      tokenOk: boolean;
      username: string | null;
      error: string | null;
    } = {
      connected: false,
      tokenOk: false,
      username: null,
      error: null,
    };

    const twAccount = await GetLinkedAccount(user.id, "twitter");
    if (twAccount?.accessToken) {
      twitter.connected = true;
      twitter.username = twAccount.accountUsername || null;
      const tokenResult = await ensureTwitterAccessToken(user.id);
      if ("error" in tokenResult) {
        twitter.error = tokenResult.error;
      } else {
        const ok = await verifyTwitterToken(tokenResult.accessToken);
        twitter.tokenOk = ok;
        if (!ok) twitter.error = "Token failed verification. Reconnect Twitter";
      }
    } else {
      twitter.error = "Not connected";
    }

    // Instagram
    const igAccount = await GetLinkedAccount(user.id, "instagram");
    const instagram = {
      connected: !!(igAccount?.accessToken && igAccount?.accountId),
      username: igAccount?.accountUsername || null,
      note: "Auto-post needs a public image URL in the caption",
    };

    const allPending = await GetPendingScheduledPosts();
    const mine = allPending.filter((p) => p.userId === user.id);

    const duePosts = mine.map((p) => {
      const platform = p.platform.toLowerCase();
      let ready = false;
      let reason = "";

      if (platform === "twitter") {
        ready = twitter.tokenOk;
        reason = ready
          ? "Will auto-post on next run"
          : twitter.error || "Twitter not ready";
      } else if (platform === "instagram") {
        const hasImage = /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i.test(
          p.content
        );
        ready = instagram.connected && hasImage;
        reason = !instagram.connected
          ? "Instagram not connected"
          : !hasImage
            ? "Needs a public image URL in the post"
            : "Will auto-post on next run";
      } else if (platform === "linkedin" || platform === "tiktok") {
        ready = false;
        reason = "Reminder only, auto-post not built yet";
      } else {
        ready = false;
        reason = "Platform not supported for auto-post";
      }

      return {
        id: p.id,
        platform: p.platform,
        scheduledFor: p.scheduledFor,
        preview: p.content.slice(0, 80),
        ready,
        reason,
      };
    });

    const checks = [
      {
        id: "twitter_env",
        ok: twitterEnv,
        label: "Twitter API keys in env",
      },
      {
        id: "twitter_connected",
        ok: twitter.connected && twitter.tokenOk,
        label: "Twitter connected with valid token",
      },
      {
        id: "cron_secret",
        ok: cronSecretSet || process.env.NODE_ENV !== "production",
        label: "CRON_SECRET set (required in production)",
      },
      {
        id: "instagram_env",
        ok: igEnv,
        label: "Instagram/Facebook API keys in env (optional)",
      },
    ];

    const canAutoPostTwitter = twitterEnv && twitter.connected && twitter.tokenOk;

    return NextResponse.json({
      canAutoPostTwitter,
      twitter,
      instagram,
      cronSecretSet,
      duePosts,
      dueCount: duePosts.length,
      readyCount: duePosts.filter((d) => d.ready).length,
      checks,
      tip:
        duePosts.length === 0
          ? "Schedule a Twitter post a minute in the past (or wait until due), then use “Run due posts now”."
          : "Use “Run due posts now” to publish ready items without waiting for cron.",
    });
  } catch (error) {
    console.error("[Publish readiness]", error);
    return NextResponse.json(
      { error: "Failed to check readiness" },
      { status: 500 }
    );
  }
}
