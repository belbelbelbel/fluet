/**
 * Individual Client API Routes
 * Handles GET, PUT, DELETE for a specific client
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { 
    GetClientById,
    UpdateClient,
    DeleteClient,
    GetUserByClerkId 
} from "@/utils/db/actions";

export const dynamic = "force-dynamic";

/**
 * GET /api/clients/[id]
 * Get a specific client
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Get userId from query params first (from frontend)
        const searchParams = req.nextUrl.searchParams;
        const queryUserId = searchParams.get("userId");
        
        // Get authentication from Clerk - try multiple methods (same pattern as generate API)
        const authResult = await auth();
        let clerkUserId: string | null | undefined = authResult?.userId || queryUserId || null;
        
        // If auth() didn't work, try currentUser() as fallback
        if (!clerkUserId) {
            try {
                const user = await currentUser();
                clerkUserId = user?.id ?? null;
            } catch (userError) {
                console.warn("[Client API GET] currentUser() failed:", userError);
            }
        }
        
        if (!clerkUserId) {
            console.warn("[Client API GET] No userId from auth()");
            return NextResponse.json(
                { 
                    error: "Unauthorized",
                    details: "Please sign in to access this client. If you're already signed in, please try refreshing the page."
                },
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

        const client = await GetClientById(clientId, user.id);
        if (!client) {
            return NextResponse.json(
                { error: "Client not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            client,
        });
    } catch (error) {
        console.error("[Client API] GET Error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to fetch client",
            },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/clients/[id]
 * Update a client
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Get authentication from Clerk - try multiple methods (same pattern as generate API)
        const authResult = await auth();
        let clerkUserId: string | null | undefined = authResult?.userId || null;
        
        // If auth() didn't work, try currentUser() as fallback
        if (!clerkUserId) {
            try {
                const user = await currentUser();
                clerkUserId = user?.id ?? null;
            } catch (userError) {
                console.warn("[Client API PUT] currentUser() failed:", userError);
            }
        }
        
        if (!clerkUserId) {
            console.warn("[Client API PUT] No userId from auth()");
            return NextResponse.json(
                { 
                    error: "Unauthorized",
                    details: "Please sign in to update this client. If you're already signed in, please try refreshing the page."
                },
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

        const body = await req.json();
        const { name, logoUrl, status, paymentStatus, paymentDueDate } = body;

        const updatedClient = await UpdateClient(clientId, user.id, {
            name,
            logoUrl,
            status,
            paymentStatus,
            paymentDueDate: paymentDueDate ? new Date(paymentDueDate) : undefined,
        });

        if (!updatedClient) {
            return NextResponse.json(
                { error: "Client not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            client: updatedClient,
            message: "Client updated successfully",
        });
    } catch (error) {
        console.error("[Client API] PUT Error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to update client",
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/clients/[id]
 * Delete a client (soft delete)
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Get authentication from Clerk - try multiple methods (same pattern as generate API)
        const authResult = await auth();
        let clerkUserId: string | null | undefined = authResult?.userId || null;
        
        // If auth() didn't work, try currentUser() as fallback
        if (!clerkUserId) {
            try {
                const user = await currentUser();
                clerkUserId = user?.id ?? null;
            } catch (userError) {
                console.warn("[Client API DELETE] currentUser() failed:", userError);
            }
        }
        
        if (!clerkUserId) {
            console.warn("[Client API DELETE] No userId from auth()");
            return NextResponse.json(
                { 
                    error: "Unauthorized",
                    details: "Please sign in to delete this client. If you're already signed in, please try refreshing the page."
                },
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

        const deletedClient = await DeleteClient(clientId, user.id);
        if (!deletedClient) {
            return NextResponse.json(
                { error: "Client not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Client deleted successfully",
        });
    } catch (error) {
        console.error("[Client API] DELETE Error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to delete client",
            },
            { status: 500 }
        );
    }
}
