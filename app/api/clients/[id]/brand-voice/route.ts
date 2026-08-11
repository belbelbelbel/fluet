/**
 * Brand Voice API Routes
 * Handles brand voice CRUD operations
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
    SaveClientBrandVoice,
    GetClientBrandVoice,
} from "@/utils/db/actions";
import { requireClientAccess } from "@/lib/team-access";

export const dynamic = "force-dynamic";

/**
 * GET /api/clients/[id]/brand-voice
 * Get brand voice for a client
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

        const brandVoice = await GetClientBrandVoice(clientId);

        return NextResponse.json({
            success: true,
            brandVoice: brandVoice || null,
        });
    } catch (error) {
        console.error("[Brand Voice API] GET Error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to fetch brand voice",
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/clients/[id]/brand-voice
 * Create or update brand voice
 */
export async function POST(
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

        const body = await req.json();
        const {
            brandDescription,
            targetAudience,
            niche,
            primaryIndustry,
            nicheDescription,
            tone,
            slangLevel,
            industry,
            dos,
            donts,
            examplePosts,
            preferredHashtags,
            bannedWords,
        } = body;

        const brandVoice = await SaveClientBrandVoice({
            clientId,
            brandDescription,
            targetAudience,
            niche,
            primaryIndustry,
            nicheDescription,
            tone,
            slangLevel,
            industry,
            dos,
            donts,
            examplePosts,
            preferredHashtags,
            bannedWords,
        });

        return NextResponse.json({
            success: true,
            brandVoice,
            message: "Brand voice saved successfully",
        });
    } catch (error) {
        console.error("[Brand Voice API] POST Error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to save brand voice",
            },
            { status: 500 }
        );
    }
}
