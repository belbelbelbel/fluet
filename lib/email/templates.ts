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

function isLocalhostUrl(href?: string): boolean {
  if (!href) return false;
  try {
    const u = new URL(href);
    return u.hostname === "localhost" || u.hostname === "127.0.0.1";
  } catch {
    return href.includes("localhost");
  }
}

/** Shared shell — clean, light, transactional (not marketing-y). */
function layout(opts: {
  preheader: string;
  title: string;
  body: string;
}): string {
  const { preheader, title, body } = opts;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Georgia,'Times New Roman',serif;color:#18181b;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;">
          <tr>
            <td style="padding:0 4px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#71717a;">
              Revvy
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border-radius:4px;padding:36px 32px;border:1px solid #e4e4e7;">
              <h1 style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:22px;font-weight:600;line-height:1.3;color:#09090b;letter-spacing:-0.02em;">
                ${escapeHtml(title)}
              </h1>
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 4px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;line-height:1.5;color:#a1a1aa;">
              Sent by Revvy · getrevvy.pro
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#3f3f46;">${text}</p>`;
}

function metaRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#71717a;width:120px;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:10px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#18181b;font-weight:500;">${value}</td>
  </tr>`;
}

function metaTable(rows: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:8px 0 24px;border-top:1px solid #f4f4f5;border-bottom:1px solid #f4f4f5;">${rows}</table>`;
}

function cta(href: string, label: string): string {
  const safeHref = escapeHtml(href);
  const showRaw = !isLocalhostUrl(href);
  return `
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:8px 0 8px;">
      <tr>
        <td style="border-radius:6px;background:#18181b;">
          <a href="${safeHref}" style="display:inline-block;padding:12px 22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:600;color:#fafafa;text-decoration:none;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>
    ${
      showRaw
        ? `<p style="margin:12px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;line-height:1.5;color:#a1a1aa;word-break:break-all;">Or open: ${safeHref}</p>`
        : `<p style="margin:12px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;line-height:1.5;color:#a1a1aa;">Button not working? Open the invite from your Revvy Team page after signing in.</p>`
    }`;
}

function plainCta(href: string | undefined, label: string): string {
  if (!href) return "";
  if (isLocalhostUrl(href)) return `\n${label}: sign in to Revvy → Team\n`;
  return `\n${label}: ${href}\n`;
}

/**
 * Shows the agency *who* actually made the decision.
 *
 * The decision endpoint only accepts a submission from someone who proved
 * control of the client's address, so this line is evidence rather than a
 * self-reported name — it's what distinguishes a real sign-off from someone
 * who was merely forwarded the link.
 */
function verifiedRow(email: string | undefined): string {
  if (!email) return "";
  return metaRow(
    "Verified as",
    `${escapeHtml(email)} <span style="font-weight:400;color:#16a34a;">✓ email confirmed</span>`
  );
}

function verifiedText(email: string | undefined): string {
  return email ? `\nVerified as: ${email} (email confirmed)` : "";
}

export type BuiltEmail = { subject: string; html: string; text: string };

export function buildEmailContent(
  type: NotificationType,
  data: NotificationEmailData
): BuiltEmail {
  const clientName = data.clientName || "your client";

  switch (type) {
    case "approval_verification_code": {
      const code = data.code || "";
      const subject = `${code} is your Revvy approval code`;
      const html = layout({
        preheader: `Your verification code is ${code}`,
        title: "Confirm it's you",
        body: `
          ${p("Enter this code in the approval page to confirm you're the right person to sign off on this post.")}
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
            <tr>
              <td style="background:#f4f4f5;border-radius:12px;padding:18px 28px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:32px;font-weight:600;letter-spacing:10px;color:#18181b;">
                ${escapeHtml(code)}
              </td>
            </tr>
          </table>
          ${p(`<span style="font-size:13px;color:#71717a;">This code expires in ${data.codeTtlMinutes ?? 10} minutes. If you didn't request it, you can ignore this email — nothing will change.</span>`)}
        `,
      });
      const text = [
        `Your Revvy approval code: ${code}`,
        ``,
        `Enter it on the approval page to confirm it's you.`,
        `Expires in ${data.codeTtlMinutes ?? 10} minutes.`,
        `Didn't request this? Ignore this email — nothing will change.`,
      ].join("\n");
      return { subject, html, text };
    }

    case "approval_requested": {
      const subject = `Post approval needed — ${clientName}`;
      const html = layout({
        preheader: `Review a scheduled post for ${clientName}`,
        title: "A post needs your approval",
        body: `
          ${p(`Hi${data.clientName ? ` ${escapeHtml(data.clientName)}` : ""},`)}
          ${p("Your agency scheduled a post that needs your review before it goes live.")}
          ${metaTable(`
            ${metaRow("Platform", escapeHtml(data.platform || "N/A"))}
            ${metaRow("Scheduled", escapeHtml(formatWhen(data.scheduledFor)))}
            ${metaRow("Preview", `<span style="font-weight:400;white-space:pre-wrap;">${escapeHtml((data.content || "").slice(0, 280))}</span>`)}
          `)}
          ${data.approvalLink ? cta(data.approvalLink, "Review & approve") : ""}
          ${p(`<span style="font-size:13px;color:#71717a;">Link expires ${escapeHtml(formatWhen(data.expiresAt))}.</span>`)}
        `,
      });
      const text = [
        `A post needs your approval`,
        ``,
        `Platform: ${data.platform || "N/A"}`,
        `Scheduled: ${formatWhen(data.scheduledFor)}`,
        data.content ? `Preview: ${data.content.slice(0, 280)}` : "",
        plainCta(data.approvalLink, "Review"),
      ]
        .filter(Boolean)
        .join("\n");
      return { subject, html, text };
    }

    case "approval_approved": {
      const subject = `Post approved — ${clientName}`;
      const html = layout({
        preheader: `${clientName} approved your post`,
        title: "Post approved",
        body: `
          ${p(`${escapeHtml(clientName)} approved the scheduled post. It will publish as planned.`)}
          ${metaTable(`
            ${metaRow("Platform", escapeHtml(data.platform || "N/A"))}
            ${metaRow("Scheduled", escapeHtml(formatWhen(data.scheduledFor)))}
            ${verifiedRow(data.decidedByEmail)}
          `)}
          ${data.editLink ? cta(data.editLink, "View schedule") : ""}
        `,
      });
      const text = `Post approved by ${clientName}.\nPlatform: ${data.platform || "N/A"}${verifiedText(data.decidedByEmail)}\n${plainCta(data.editLink, "View schedule")}`;
      return { subject, html, text };
    }

    case "approval_changes_requested": {
      const subject = `Changes requested — ${clientName}`;
      const html = layout({
        preheader: `${clientName} asked for edits`,
        title: "Changes requested",
        body: `
          ${p(`${escapeHtml(clientName)} asked for edits before approving this post.`)}
          ${metaTable(`
            ${metaRow("Platform", escapeHtml(data.platform || "N/A"))}
            ${metaRow("Feedback", `<span style="font-weight:400;white-space:pre-wrap;">${escapeHtml(data.comment || "No comment")}</span>`)}
            ${verifiedRow(data.decidedByEmail)}
          `)}
          ${data.editLink ? cta(data.editLink, "Edit in dashboard") : ""}
        `,
      });
      const text = `Changes requested by ${clientName}.\n${data.comment || ""}${verifiedText(data.decidedByEmail)}\n${plainCta(data.editLink, "Edit")}`;
      return { subject, html, text };
    }

    case "approval_rejected": {
      const subject = `Post rejected — ${clientName}`;
      const html = layout({
        preheader: `${clientName} rejected the post`,
        title: "Post rejected",
        body: `
          ${p(`${escapeHtml(clientName)} rejected the scheduled post.`)}
          ${metaTable(`
            ${metaRow("Platform", escapeHtml(data.platform || "N/A"))}
            ${data.comment ? metaRow("Feedback", `<span style="font-weight:400;white-space:pre-wrap;">${escapeHtml(data.comment)}</span>`) : ""}
            ${verifiedRow(data.decidedByEmail)}
          `)}
          ${data.editLink ? cta(data.editLink, "View schedule") : ""}
        `,
      });
      const text = `Post rejected by ${clientName}.${verifiedText(data.decidedByEmail)}\n${plainCta(data.editLink, "View schedule")}`;
      return { subject, html, text };
    }

    case "task_assigned": {
      const subject = `New task — ${clientName}`;
      const html = layout({
        preheader: `New task for ${clientName}`,
        title: "You have a new task",
        body: `
          ${p(`Hi ${escapeHtml(data.assignedToName || "there")},`)}
          ${p(`A task was assigned to you for ${escapeHtml(clientName)}.`)}
          ${metaTable(`
            ${metaRow("Type", escapeHtml(data.taskType || "Task"))}
            ${data.dueDate ? metaRow("Due", escapeHtml(data.dueDate)) : ""}
            ${data.description ? metaRow("Details", `<span style="font-weight:400;white-space:pre-wrap;">${escapeHtml(data.description)}</span>`) : ""}
          `)}
          ${data.taskLink ? cta(data.taskLink, "Open task") : ""}
        `,
      });
      const text = `New task for ${clientName}.\nType: ${data.taskType || "Task"}\n${plainCta(data.taskLink, "Open task")}`;
      return { subject, html, text };
    }

    case "clients_assigned": {
      const names = data.clientNames || [];
      const count = names.length;
      const subject =
        count === 1
          ? `You've been assigned to ${names[0]}`
          : `You've been assigned to ${count} clients`;
      const html = layout({
        preheader:
          count === 1
            ? `You now handle ${names[0]}`
            : `You now handle ${count} clients`,
        title: count === 1 ? "New client assigned" : "New clients assigned",
        body: `
          ${p(`Hi ${escapeHtml(data.assignedToName || "there")},`)}
          ${p(
            `${escapeHtml(data.inviterName || "Your agency")} assigned you to ${
              count === 1 ? "a new client" : `${count} new clients`
            }. You can now create, schedule, and manage their content.`
          )}
          ${metaTable(
            names
              .map((n, i) => metaRow(count === 1 ? "Client" : `Client ${i + 1}`, escapeHtml(n)))
              .join("")
          )}
          ${data.dashboardLink ? cta(data.dashboardLink, "Open dashboard") : ""}
        `,
      });
      const text = [
        count === 1 ? "New client assigned" : "New clients assigned",
        ``,
        ...names.map((n) => `- ${n}`),
        plainCta(data.dashboardLink, "Open dashboard"),
      ]
        .filter(Boolean)
        .join("\n");
      return { subject, html, text };
    }

    case "team_invitation": {
      const inviter = data.inviterName || "A teammate";
      const role = data.role || "member";
      const subject = `${inviter} invited you to Revvy`;
      const html = layout({
        preheader: `${inviter} invited you to join their team`,
        title: "You're invited",
        body: `
          ${p(`<strong style="color:#09090b;font-weight:600;">${escapeHtml(inviter)}</strong> invited you to join their agency team on Revvy.`)}
          ${p("Accept to collaborate on clients, content, and tasks. New here? You can create an account from the invite.")}
          ${metaTable(`
            ${metaRow("Role", escapeHtml(role))}
            ${data.expiresAt ? metaRow("Expires", escapeHtml(formatWhen(data.expiresAt))) : ""}
          `)}
          ${data.inviteLink ? cta(data.inviteLink, "Accept invite") : ""}
        `,
      });
      const text = [
        `${inviter} invited you to join their team on Revvy.`,
        `Role: ${role}`,
        data.expiresAt ? `Expires: ${formatWhen(data.expiresAt)}` : "",
        plainCta(data.inviteLink, "Accept invite"),
        ``,
        `— Revvy · getrevvy.pro`,
      ]
        .filter(Boolean)
        .join("\n");
      return { subject, html, text };
    }

    default: {
      throw new Error(`Unknown notification type: ${String(type)}`);
    }
  }
}
