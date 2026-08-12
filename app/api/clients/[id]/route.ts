/**
 * Individual Client API Routes
 * Handles GET, PUT, DELETE for a specific client
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
    UpdateClient,
    DeleteClient,
    GetUserByClerkId,
} from "@/utils/db/actions";
import {
    resolveAgencyContext,
    assertClientAccess,
    canAccessAllClients,
} from "@/lib/team-access";
import { sendPendingApprovalsToClient } from "@/utils/approvals/notify";

export const dynamic = "force-dynamic";

async function resolveClerkId() {
    const authResult = await auth();
    let clerkUserId: string | null | undefined = authResult?.userId || null;
    if (!clerkUserId) {
        try {
            const user = await currentUser();
            clerkUserId = user?.id ?? null;
        } catch {
            // ignore
        }
    }
    return clerkUserId;
}

/**
 * GET /api/clients/[id]
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const clerkUserId = await resolveClerkId();

        if (!clerkUserId) {
            return NextResponse.json(
                { error: "Unauthorized", details: "Please sign in to access this client." },
                { status: 401 }
            );
        }

        const user = await GetUserByClerkId(clerkUserId);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const clientId = parseInt(params.id);
        if (isNaN(clientId)) {
            return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
        }

        const ctx = await resolveAgencyContext(clerkUserId);
        if (!ctx) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const client = await assertClientAccess(ctx, clientId);
        if (!client) {
            return NextResponse.json(
                { error: "Client not found or access denied" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, client });
    } catch (error) {
        console.error("[Client API] GET Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch client" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/clients/[id]
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const clerkUserId = await resolveClerkId();
        if (!clerkUserId) {
            return NextResponse.json(
                { error: "Unauthorized", details: "Please sign in to update this client." },
                { status: 401 }
            );
        }

        const ctx = await resolveAgencyContext(clerkUserId);
        if (!ctx) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (!canAccessAllClients(ctx.role)) {
            return NextResponse.json(
                { error: "You don't have permission to update clients" },
                { status: 403 }
            );
        }

        const clientId = parseInt(params.id);
        if (isNaN(clientId)) {
            return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
        }

        const client = await assertClientAccess(ctx, clientId);
        if (!client) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        const body = await req.json();
        const { name, email, logoUrl, status, paymentStatus, paymentDueDate } = body;

        const updatedClient = await UpdateClient(clientId, ctx.agencyId, {
            name,
            email: email !== undefined ? (email?.trim() || null) : undefined,
            logoUrl,
            status,
            paymentStatus,
            paymentDueDate: paymentDueDate ? new Date(paymentDueDate) : undefined,
        });

        if (!updatedClient) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        // A client that gains (or corrects) an email may have approvals that
        // were never actually delivered — the link is useless sitting in the
        // database. Send the outstanding ones to the new address.
        const nextEmail = updatedClient.email?.trim() || null;
        const emailChanged =
            email !== undefined && nextEmail && nextEmail !== client.email?.trim();

        let approvalsSent = 0;
        if (emailChanged) {
            try {
                const result = await sendPendingApprovalsToClient({
                    clientId,
                    clientName: updatedClient.name,
                    email: nextEmail,
                });
                approvalsSent = result.sent;
            } catch (notifyError) {
                // Never fail the update because an email bounced
                console.error("[Client API] Approval resend failed:", notifyError);
            }
        }

        return NextResponse.json({
            success: true,
            client: updatedClient,
            approvalsSent,
            message:
                approvalsSent > 0
                    ? `Client updated — sent ${approvalsSent} pending approval${approvalsSent !== 1 ? "s" : ""} to ${nextEmail}`
                    : "Client updated successfully",
        });
    } catch (error) {
        console.error("[Client API] PUT Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to update client" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/clients/[id]
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const clerkUserId = await resolveClerkId();
        if (!clerkUserId) {
            return NextResponse.json(
                { error: "Unauthorized", details: "Please sign in to delete this client." },
                { status: 401 }
            );
        }

        const ctx = await resolveAgencyContext(clerkUserId);
        if (!ctx) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Only owner/admin can delete clients
        if (ctx.role !== "owner" && ctx.role !== "admin") {
            return NextResponse.json(
                { error: "You don't have permission to delete clients" },
                { status: 403 }
            );
        }

        const clientId = parseInt(params.id);
        if (isNaN(clientId)) {
            return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
        }

        const deletedClient = await DeleteClient(clientId, ctx.agencyId);
        if (!deletedClient) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Client deleted successfully",
        });
    } catch (error) {
        console.error("[Client API] DELETE Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to delete client" },
            { status: 500 }
        );
    }
}
