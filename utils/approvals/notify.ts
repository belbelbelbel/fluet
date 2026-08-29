/**
 * Delivering approval links to a client after the fact.
 *
 * An approval link is emailed when the post is scheduled. If the client had no
 * email on file at that moment, or the address was wrong, the link was never
 * delivered and the approval silently stalls. Whenever we learn a usable
 * address, outstanding approvals are (re)sent.
 */

import { and, eq } from "drizzle-orm";
import { db } from "@/utils/db/dbConfig";
import { PostApprovals, ScheduledPosts } from "@/utils/db/schema";
import { getEmailAppUrl, sendNotificationEmail } from "@/lib/email/send-notification";

export async function sendPendingApprovalsToClient(params: {
  clientId: number;
  clientName: string;
  email: string;
}): Promise<{ sent: number; failed: number }> {
  const { clientId, clientName, email } = params;

  const to = email?.trim();
  if (!to || !to.includes("@")) return { sent: 0, failed: 0 };

  const rows = await db
    .select({
      token: PostApprovals.approvalToken,
      expiresAt: PostApprovals.expiresAt,
      platform: ScheduledPosts.platform,
      content: ScheduledPosts.content,
      scheduledFor: ScheduledPosts.scheduledFor,
      posted: ScheduledPosts.posted,
    })
    .from(PostApprovals)
    .innerJoin(ScheduledPosts, eq(ScheduledPosts.id, PostApprovals.scheduledPostId))
    .where(
      and(
        eq(PostApprovals.clientId, clientId),
        eq(PostApprovals.status, "pending"),
        eq(ScheduledPosts.posted, false)
      )
    )
    .execute();

  if (rows.length === 0) return { sent: 0, failed: 0 };

  const appUrl = getEmailAppUrl();
  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const result = await sendNotificationEmail({
        type: "approval_requested",
        recipientEmail: to,
        data: {
          clientName,
          platform: row.platform,
          scheduledFor:
            row.scheduledFor?.toISOString?.() ?? String(row.scheduledFor),
          content: row.content,
          approvalLink: `${appUrl}/client-portal/${row.token}`,
          expiresAt: row.expiresAt?.toISOString?.() ?? undefined,
        },
      });
      if (result.sent) sent++;
      else failed++;
    } catch (error) {
      console.error("[Approvals] Failed to send pending approval:", error);
      failed++;
    }
  }

  return { sent, failed };
}
