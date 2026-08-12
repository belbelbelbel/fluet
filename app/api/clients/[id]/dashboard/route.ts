/**
 * Agency client dashboard — real stats, approvals, and upcoming posts
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  GetClientCredits,
  GetPendingApprovalsForClient,
  GetScheduledPostsByClientId,
} from "@/utils/db/actions";
import { requireClientAccess } from "@/lib/team-access";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);

    const authResult = await auth();
    let clerkUserId: string | null = authResult?.userId || null;

    if (!clerkUserId) {
      try {
        const user = await currentUser();
        clerkUserId = user?.id ?? null;
      } catch {
        // ignore
      }
    }

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = parseInt(resolvedParams.id, 10);
    if (Number.isNaN(clientId)) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    const access = await requireClientAccess(clerkUserId, clientId);
    if (!access.ok) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      );
    }

    const [posts, approvals, credits] = await Promise.all([
      GetScheduledPostsByClientId(clientId),
      GetPendingApprovalsForClient(clientId),
      GetClientCredits(clientId),
    ]);

    const now = new Date();
    const upcomingPosts = posts.filter(
      (p) => !p.posted && p.scheduledFor && new Date(p.scheduledFor) > now
    );

    // Record of what actually went out for this client, newest first. Falls
    // back to scheduledFor for rows published before postedAt was recorded.
    const publishedPosts = posts
      .filter((p) => p.posted)
      .sort(
        (a, b) =>
          new Date(b.postedAt ?? b.scheduledFor ?? 0).getTime() -
          new Date(a.postedAt ?? a.scheduledFor ?? 0).getTime()
      );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const pendingApprovals = approvals.map((a) => {
      const post = posts.find((p) => p.id === a.scheduledPostId);
      return {
        id: a.id,
        approvalToken: a.approvalToken,
        status: a.status,
        scheduledPostId: a.scheduledPostId,
        content: post?.content ?? "",
        platform: post?.platform ?? "",
        scheduledFor: post?.scheduledFor ?? null,
        approvalLink: `${appUrl}/client-portal/${a.approvalToken}`,
        createdAt: a.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        postsThisMonth: credits?.postsUsed ?? 0,
        postsLimit: credits?.postsPerMonth ?? 12,
        pendingApprovals: pendingApprovals.length,
        scheduledPosts: upcomingPosts.length,
        publishedPosts: publishedPosts.length,
        engagementRate: null as number | null,
        engagementMetricsAvailable: false,
      },
      pendingApprovals,
      upcomingPosts: upcomingPosts.slice(0, 8).map((p) => ({
        id: p.id,
        platform: p.platform,
        content: p.content,
        scheduledFor: p.scheduledFor,
        posted: p.posted,
        approvalStatus: p.approvalStatus,
      })),
      publishedPosts: publishedPosts.slice(0, 20).map((p) => ({
        id: p.id,
        platform: p.platform,
        content: p.content,
        scheduledFor: p.scheduledFor,
        postedAt: p.postedAt,
        posted: p.posted,
      })),
    });
  } catch (error) {
    console.error("[Client dashboard API] GET Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
}
