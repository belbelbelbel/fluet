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
