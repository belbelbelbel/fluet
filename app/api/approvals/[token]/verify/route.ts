/**
 * Approval identity verification
 *
 * POST { email }        -> emails a 6-digit code to the client's address on file
 * POST { email, code }  -> checks the code, sets an httpOnly session cookie
 */

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { GetApprovalByToken } from "@/utils/db/actions";
import { db } from "@/utils/db/dbConfig";
import { Clients } from "@/utils/db/schema";
import { sendNotificationEmail } from "@/lib/email/send-notification";
import {
    CODE_TTL_MINUTES,
    SESSION_TTL_HOURS,
    confirmVerificationCode,
    cookieNameFor,
    issueVerificationCode,
    maskEmail,
    normalizeEmail,
} from "@/utils/approvals/verification";

export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
    return NextResponse.json(body, {
        status,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
}

export async function POST(
    req: NextRequest,
    { params }: { params: { token: string } }
) {
    try {
        const { token } = params;
        const { email, code } = await req.json();

        const approval = await GetApprovalByToken(token);
        if (!approval) return json({ error: "Approval not found" }, 404);

        if (approval.status !== "pending") {
            return json(
                { error: `This post has already been ${approval.status}` },
                400
            );
        }

        // ---- Step 2: confirm a submitted code ----
        if (code) {
            const result = await confirmVerificationCode(approval.id, String(code));

            if (!result.ok) {
                const message =
                    result.reason === "expired"
                        ? "That code has expired. Request a new one."
                        : result.reason === "too_many_attempts"
                          ? "Too many incorrect attempts. Request a new code."
                          : result.reason === "no_pending"
                            ? "Request a code first."
                            : "That code isn't right.";
                return json({ error: message, reason: result.reason }, 400);
            }

            const res = json({ success: true, email: result.email });
            res.cookies.set(cookieNameFor(approval.id), result.sessionToken, {
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                path: "/",
                maxAge: SESSION_TTL_HOURS * 60 * 60,
            });
            return res;
        }

        // ---- Step 1: issue a code ----
        if (!email || typeof email !== "string") {
            return json({ error: "Email is required" }, 400);
        }

        const [client] = await db
            .select({ id: Clients.id, name: Clients.name, email: Clients.email })
            .from(Clients)
            .where(eq(Clients.id, approval.clientId))
            .limit(1)
            .execute();

        if (!client?.email) {
            return json(
                {
                    error:
                        "This client has no email on file, so we can't verify you. Ask your agency to add one.",
                },
                409
            );
        }

        // The address must match the client record — this is the actual gate.
        if (normalizeEmail(email) !== normalizeEmail(client.email)) {
            return json(
                { error: "That email doesn't match the one this approval was sent to." },
                403
            );
        }

        const { code: freshCode } = await issueVerificationCode(
            approval.id,
            client.email
        );

        const emailResult = await sendNotificationEmail({
            type: "approval_verification_code",
            recipientEmail: client.email,
            data: {
                clientName: client.name,
                code: freshCode,
                codeTtlMinutes: CODE_TTL_MINUTES,
            },
        });

        if (!emailResult.sent) {
            console.error("[Approval Verify] Failed to send code:", emailResult.error);
            return json(
                {
                    error: "Couldn't send the code. Try again in a moment.",
                    // Surfacing the cause locally saves a round-trip through logs
                    detail:
                        process.env.NODE_ENV === "production"
                            ? undefined
                            : emailResult.error,
                },
                502
            );
        }

        return json({
            success: true,
            sentTo: maskEmail(normalizeEmail(client.email)),
            expiresInMinutes: CODE_TTL_MINUTES,
        });
    } catch (error) {
        console.error("[Approval Verify] Error:", error);
        return json({ error: "Verification failed" }, 500);
    }
}
