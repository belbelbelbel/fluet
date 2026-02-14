/**
 * Brand Voice API Routes
 * Handles brand voice CRUD operations
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
    GetClientById,
    GetUserByClerkId,
    SaveClientBrandVoice,
    GetClientBrandVoice,
} from "@/utils/db/actions";

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

        const body = await req.json();
        const {
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
