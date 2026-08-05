import { Resend } from "resend";
import { buildEmailContent } from "./templates";
import type {
  NotificationEmailData,
  NotificationType,
  SendNotificationResult,
} from "./types";

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/** Sender must be set via RESEND_FROM_EMAIL — must match the domain verified in Resend. */
export function getResendFromAddress(): string | null {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  return from || null;
}

export async function sendNotificationEmail(params: {
  type: NotificationType;
  recipientEmail: string;
  data: NotificationEmailData;
}): Promise<SendNotificationResult> {
  const { type, recipientEmail, data } = params;
  const to = recipientEmail.trim();

  if (!to || !to.includes("@")) {
    return {
      success: false,
      sent: false,
      error: "Invalid recipient email",
    };
  }

  const resend = getResendClient();
  if (!resend) {
    console.error("[Email] RESEND_API_KEY is not configured — email not sent", {
      type,
      to,
    });
    return {
      success: false,
      sent: false,
      error: "Email service not configured (missing RESEND_API_KEY)",
    };
  }

  const from = getResendFromAddress();
  if (!from) {
    console.error("[Email] RESEND_FROM_EMAIL is not configured — email not sent", {
      type,
      to,
    });
    return {
      success: false,
      sent: false,
      error: "Email service not configured (missing RESEND_FROM_EMAIL)",
    };
  }

  let subject: string;
  let html: string;
  try {
    ({ subject, html } = buildEmailContent(type, data));
  } catch (err) {
    console.error("[Email] Failed to build template:", err);
    return {
      success: false,
      sent: false,
      error: err instanceof Error ? err.message : "Invalid notification type",
    };
  }

  try {
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (result.error) {
      console.error("[Email] Resend send failed:", {
        type,
        to,
        from,
        error: result.error,
      });
      return {
        success: false,
        sent: false,
        error: result.error.message || "Resend rejected the send request",
      };
    }

    console.log("[Email] Sent via Resend:", {
      type,
      to,
      from,
      messageId: result.data?.id,
    });

    return {
      success: true,
      sent: true,
      message: "Email sent",
      messageId: result.data?.id,
    };
  } catch (err) {
    console.error("[Email] Resend exception:", err);
    return {
      success: false,
      sent: false,
      error: err instanceof Error ? err.message : "Failed to send email",
    };
  }
}
