import type { NotificationEmailData, NotificationType } from "./types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatWhen(iso?: string): string {
  if (!iso) return "Not specified";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function layout(title: string, accent: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:20px 24px;background:${accent};color:#ffffff;font-size:18px;font-weight:600;">
              Revvy
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:#0f172a;">${escapeHtml(title)}</h1>
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 24px;font-size:12px;color:#64748b;border-top:1px solid #f1f5f9;">
              This is a transactional message from Revvy. Please do not reply to this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function detailBox(rows: string): string {
  return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;font-size:14px;line-height:1.6;color:#334155;">${rows}</div>`;
}

function cta(href: string, label: string): string {
  const safeHref = escapeHtml(href);
  return `<p style="margin:20px 0 8px;">
    <a href="${safeHref}" style="display:inline-block;background:#9333ea;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:14px;">
      ${escapeHtml(label)}
    </a>
  </p>
  <p style="margin:8px 0 0;font-size:12px;color:#64748b;word-break:break-all;">${safeHref}</p>`;
}

export function buildEmailContent(
  type: NotificationType,
  data: NotificationEmailData
): { subject: string; html: string } {
  const clientName = data.clientName || "your client";

  switch (type) {
    case "approval_requested": {
      const subject = `Post approval needed — ${clientName}`;
      const html = layout(
        "A post is waiting for your approval",
        "#9333ea",
        `<p style="margin:0 0 12px;font-size:15px;color:#475569;">
          Hi${data.clientName ? ` ${escapeHtml(data.clientName)}` : ""},
        </p>
        <p style="margin:0 0 12px;font-size:15px;color:#475569;">
          Your agency scheduled a post that needs your review before it goes live.
        </p>
        ${detailBox(`
          <p style="margin:0 0 8px;"><strong>Platform:</strong> ${escapeHtml(data.platform || "N/A")}</p>
          <p style="margin:0 0 8px;"><strong>Scheduled for:</strong> ${escapeHtml(formatWhen(data.scheduledFor))}</p>
          <p style="margin:0 0 8px;"><strong>Preview:</strong></p>
          <p style="margin:0;white-space:pre-wrap;">${escapeHtml(data.content || "")}</p>
        `)}
        ${data.approvalLink ? cta(data.approvalLink, "Review & approve") : ""}
        <p style="margin:12px 0 0;font-size:13px;color:#64748b;">
          Link expires ${escapeHtml(formatWhen(data.expiresAt))}.
        </p>`
      );
      return { subject, html };
    }

    case "approval_approved": {
      const subject = `Post approved — ${clientName}`;
      const html = layout(
        "Your client approved the post",
        "#059669",
        `<p style="margin:0 0 12px;font-size:15px;color:#475569;">
          ${escapeHtml(clientName)} approved the scheduled post. It will publish as planned.
        </p>
        ${detailBox(`
          <p style="margin:0 0 8px;"><strong>Platform:</strong> ${escapeHtml(data.platform || "N/A")}</p>
          <p style="margin:0;"><strong>Scheduled for:</strong> ${escapeHtml(formatWhen(data.scheduledFor))}</p>
        `)}
        ${data.editLink ? cta(data.editLink, "View schedule") : ""}`
      );
      return { subject, html };
    }

    case "approval_changes_requested": {
      const subject = `Changes requested — ${clientName}`;
      const html = layout(
        "Your client requested changes",
        "#d97706",
        `<p style="margin:0 0 12px;font-size:15px;color:#475569;">
          ${escapeHtml(clientName)} asked for edits before approving this post.
        </p>
        ${detailBox(`
          <p style="margin:0 0 8px;"><strong>Platform:</strong> ${escapeHtml(data.platform || "N/A")}</p>
          <p style="margin:0 0 8px;"><strong>Client feedback:</strong></p>
          <p style="margin:0;white-space:pre-wrap;">${escapeHtml(data.comment || "No comment provided")}</p>
        `)}
        ${data.editLink ? cta(data.editLink, "Edit in dashboard") : ""}`
      );
      return { subject, html };
    }

    case "approval_rejected": {
      const subject = `Post rejected — ${clientName}`;
      const html = layout(
        "Your client rejected the post",
        "#dc2626",
        `<p style="margin:0 0 12px;font-size:15px;color:#475569;">
          ${escapeHtml(clientName)} rejected the scheduled post.
        </p>
        ${detailBox(`
          <p style="margin:0 0 8px;"><strong>Platform:</strong> ${escapeHtml(data.platform || "N/A")}</p>
          ${data.comment ? `<p style="margin:0;white-space:pre-wrap;"><strong>Feedback:</strong> ${escapeHtml(data.comment)}</p>` : ""}
        `)}
        ${data.editLink ? cta(data.editLink, "View schedule") : ""}`
      );
      return { subject, html };
    }

    case "task_assigned": {
      const subject = `New task — ${clientName}`;
      const html = layout(
        "You have a new task",
        "#9333ea",
        `<p style="margin:0 0 12px;font-size:15px;color:#475569;">
          Hi ${escapeHtml(data.assignedToName || "there")},
        </p>
        <p style="margin:0 0 12px;font-size:15px;color:#475569;">
          A task was assigned to you for ${escapeHtml(clientName)}.
        </p>
        ${detailBox(`
          <p style="margin:0 0 8px;"><strong>Type:</strong> ${escapeHtml(data.taskType || "Task")}</p>
          ${data.dueDate ? `<p style="margin:0 0 8px;"><strong>Due:</strong> ${escapeHtml(data.dueDate)}</p>` : ""}
          ${data.description ? `<p style="margin:0;white-space:pre-wrap;"><strong>Details:</strong> ${escapeHtml(data.description)}</p>` : ""}
        `)}
        ${data.taskLink ? cta(data.taskLink, "Open task") : ""}`
      );
      return { subject, html };
    }

    default: {
      throw new Error(`Unknown notification type: ${String(type)}`);
    }
  }
}
