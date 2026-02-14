/**
 * Client Credits API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
    GetClientById,
    GetUserByClerkId,
    GetClientCredits,
} from "@/utils/db/actions";

export const dynamic = "force-dynamic";

/**
 * GET /api/clients/[id]/credits
 * Get credits for a client
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { userId: clerkUserId } = await auth();

        if (!clerkUserId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await GetUserByClerkId(clerkUserId);
        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const clientId = parseInt(params.id);
        if (isNaN(clientId)) {
            return NextResponse.json(
                { error: "Invalid client ID" },
                { status: 400 }
            );
        }

        // Verify client belongs to agency
        const client = await GetClientById(clientId, user.id);
        if (!client) {
            return NextResponse.json(
                { error: "Client not found" },
                { status: 404 }
            );
        }

        const credits = await GetClientCredits(clientId);

        return NextResponse.json({
            success: true,
            credits: credits || null,
        });
    } catch (error) {
        console.error("[Credits API] GET Error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to fetch credits",
            },
            { status: 500 }
        );
    }
}
