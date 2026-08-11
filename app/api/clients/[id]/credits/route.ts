/**
 * Client Credits API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GetClientCredits } from "@/utils/db/actions";
import { requireClientAccess } from "@/lib/team-access";

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

        const clientId = parseInt(params.id);
        if (isNaN(clientId)) {
            return NextResponse.json(
                { error: "Invalid client ID" },
                { status: 400 }
            );
        }

        const access = await requireClientAccess(clerkUserId, clientId);
        if (!access.ok) {
            return NextResponse.json(
                { error: access.error },
                { status: access.status }
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
