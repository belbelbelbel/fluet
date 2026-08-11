/**
 * Approval Token Generation
 * Generates secure tokens for client approval links
 */

import { randomBytes } from "crypto";

/**
 * Generate a secure approval token
 * Format: approval-{randomBytes}-{timestamp}
 */
export function generateApprovalToken(): string {
  const randomPart = randomBytes(16).toString("hex");
  const timestamp = Date.now().toString(36);
  return `approval-${randomPart}-${timestamp}`;
}

/**
 * Validate token format
 */
export function isValidApprovalToken(token: string): boolean {
  return token.startsWith("approval-") && token.length > 30;
}

/**
 * Minimum time an approval link stays openable, regardless of how soon the
 * post is due. Without a floor, a post scheduled for tonight produces a link
 * the client can never open.
 */
export const APPROVAL_MIN_WINDOW_HOURS = 72;

/**
 * Compute when an approval link should stop working.
 *
 * The link is valid until the post is due (clients approve before publish),
 * but never for less than APPROVAL_MIN_WINDOW_HOURS from now — so short-notice
 * and already-past schedules still produce a usable link.
 */
export function computeApprovalExpiry(
  scheduledFor?: Date | string | null,
  now: Date = new Date()
): Date {
  const floor = new Date(now.getTime() + APPROVAL_MIN_WINDOW_HOURS * 60 * 60 * 1000);

  if (!scheduledFor) return floor;

  const due = new Date(scheduledFor);
  if (Number.isNaN(due.getTime())) return floor;

  return due.getTime() > floor.getTime() ? due : floor;
}
