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

/**
 * Sender must match a domain verified in Resend.
 * Prefer RESEND_FROM_EMAIL (+ optional RESEND_FROM_NAME) so .env parsers
 * don't mangle `Name <email>` angle brackets.
 */
export function getResendFromAddress(): string | null {
  const email = process.env.RESEND_FROM_EMAIL?.trim();
  if (!email) return null;
  // Already formatted
  if (email.includes("<") && email.includes(">")) return email;
  const name = process.env.RESEND_FROM_NAME?.trim() || "Revvy";
  // Plain address only
  if (email.includes("@")) return `${name} <${email}>`;
  return null;
}

/**
 * Base URL for links inside emails.
 * Prefer EMAIL_APP_URL (production domain) so links match the sending domain —
 * localhost links are a common spam trigger.
 */
export function getEmailAppUrl(): string {
  const preferred =
    process.env.EMAIL_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "http://localhost:3000";
  return preferred.replace(/\/$/, "");
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
  let text: string;
  try {
    ({ subject, html, text } = buildEmailContent(type, data));
  } catch (err) {
    console.error("[Email] Failed to build template:", err);
    return {
      success: false,
      sent: false,
      error: err instanceof Error ? err.message : "Invalid notification type",
    };
  }

  const replyTo =
    process.env.RESEND_REPLY_TO?.trim() ||
    // Prefer a real mailbox on the same domain when available
    "hello@getrevvy.pro";

  try {
    const result = await resend.emails.send({
      from,
      to,
      replyTo,
      subject,
      html,
      text,
      headers: {
        "X-Entity-Ref-ID": `${type}-${Date.now()}`,
      },
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
