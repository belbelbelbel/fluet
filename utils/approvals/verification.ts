/**
 * Approval identity verification
 *
 * The portal link is a bearer token: whoever holds it can open the page. That
 * is fine for *viewing*, but a forwarded email would otherwise let a stranger
 * approve a client's post. Before a decision is recorded we require proof of
 * access to the client's email address on file.
 */

import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/utils/db/dbConfig";
import { ApprovalVerifications } from "@/utils/db/schema";

/** How long a emailed code stays usable */
export const CODE_TTL_MINUTES = 10;
/** How long a successful verification lasts before re-challenging */
export const SESSION_TTL_HOURS = 2;
/** Wrong guesses allowed before the code is burned */
export const MAX_ATTEMPTS = 5;

export const cookieNameFor = (approvalId: number) => `rv_approval_${approvalId}`;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Constant-time compare so a wrong code can't be probed by timing */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

function hashCode(code: string, approvalId: number): string {
  return createHash("sha256").update(`${approvalId}:${code}`).digest("hex");
}

/** 6 digits, uniformly drawn — no Math.random */
function generateCode(): string {
  return String(randomBytes(4).readUInt32BE(0) % 1_000_000).padStart(6, "0");
}

/**
 * Issue a fresh code for an approval, invalidating any outstanding one.
 * Returns the plaintext code purely so the caller can email it.
 */
export async function issueVerificationCode(
  approvalId: number,
  email: string
): Promise<{ code: string; expiresAt: Date }> {
  // Burn any outstanding challenge so only the newest code works
  await db
    .update(ApprovalVerifications)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(ApprovalVerifications.approvalId, approvalId),
        isNull(ApprovalVerifications.consumedAt)
      )
    )
    .execute();

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

  await db
    .insert(ApprovalVerifications)
    .values({
      approvalId,
      email: normalizeEmail(email),
      codeHash: hashCode(code, approvalId),
      expiresAt,
    })
    .execute();

  return { code, expiresAt };
}

export type ConfirmResult =
  | { ok: true; sessionToken: string; sessionExpiresAt: Date; email: string }
  | { ok: false; reason: "no_pending" | "expired" | "too_many_attempts" | "bad_code" };

/**
 * Check a submitted code and, on success, mint a session token the portal
 * carries in an httpOnly cookie.
 */
export async function confirmVerificationCode(
  approvalId: number,
  code: string
): Promise<ConfirmResult> {
  const [challenge] = await db
    .select()
    .from(ApprovalVerifications)
    .where(
      and(
        eq(ApprovalVerifications.approvalId, approvalId),
        isNull(ApprovalVerifications.consumedAt)
      )
    )
    .orderBy(desc(ApprovalVerifications.id))
    .limit(1)
    .execute();

  if (!challenge) return { ok: false, reason: "no_pending" };

  if (new Date(challenge.expiresAt) < new Date()) {
    return { ok: false, reason: "expired" };
  }

  if (challenge.attempts >= MAX_ATTEMPTS) {
    return { ok: false, reason: "too_many_attempts" };
  }

  if (!safeEqual(hashCode(code.trim(), approvalId), challenge.codeHash)) {
    await db
      .update(ApprovalVerifications)
      .set({ attempts: challenge.attempts + 1 })
      .where(eq(ApprovalVerifications.id, challenge.id))
      .execute();
    return { ok: false, reason: "bad_code" };
  }

  const sessionToken = randomBytes(32).toString("hex");
  const sessionExpiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);

  await db
    .update(ApprovalVerifications)
    .set({ consumedAt: new Date(), sessionToken, sessionExpiresAt })
    .where(eq(ApprovalVerifications.id, challenge.id))
    .execute();

  return { ok: true, sessionToken, sessionExpiresAt, email: challenge.email };
}

/**
 * Resolve a cookie's session token back to the verified email.
 * Returns null when absent, unknown, or past its window.
 */
export async function resolveVerifiedEmail(
  approvalId: number,
  sessionToken: string | undefined
): Promise<string | null> {
  if (!sessionToken) return null;

  const [row] = await db
    .select()
    .from(ApprovalVerifications)
    .where(
      and(
        eq(ApprovalVerifications.approvalId, approvalId),
        eq(ApprovalVerifications.sessionToken, sessionToken)
      )
    )
    .limit(1)
    .execute();

  if (!row?.sessionExpiresAt) return null;
  if (new Date(row.sessionExpiresAt) < new Date()) return null;

  return row.email;
}

/** Mask an address for display: jane@acme.com -> j••e@acme.com */
export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return "your email";
  const head = user.slice(0, 1);
  const tail = user.length > 2 ? user.slice(-1) : "";
  return `${head}${"•".repeat(Math.max(user.length - 2, 1))}${tail}@${domain}`;
}
