/**
 * Email Notifications API
 * Sends transactional mail via Resend for approval and task events.
 */

import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedForEmailApi } from "@/lib/email/auth";
import { sendNotificationEmail } from "@/lib/email/send-notification";
import type { NotificationEmailData, NotificationType } from "@/lib/email/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/notifications/email
 * Send email notification
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAuthorizedForEmailApi(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, recipientEmail, data } = body as {
      type?: NotificationType;
      recipientEmail?: string;
      data?: NotificationEmailData;
    };

    if (!type || !recipientEmail) {
      return NextResponse.json(
        { error: "Type and recipient email are required" },
        { status: 400 }
      );
    }

    const result = await sendNotificationEmail({
      type,
      recipientEmail,
      data: data || {},
    });

    if (!result.success || !result.sent) {
      return NextResponse.json(
        {
          success: false,
          sent: false,
          error: result.error || "Failed to send email",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      sent: true,
      message: result.message,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("[Email Notification API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        sent: false,
        error: error instanceof Error ? error.message : "Failed to send email notification",
      },
      { status: 500 }
    );
  }
}
