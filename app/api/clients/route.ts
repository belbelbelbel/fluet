/**
 * Client Management API Routes
 * Handles CRUD operations for clients
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { 
    CreateClient, 
    GetClientsByAgency, 
    GetUserByClerkId,
    CreateOrUpdateUser
} from "@/utils/db/actions";

export const dynamic = "force-dynamic";

/**
 * GET /api/clients
 * Get all clients for the authenticated agency
 */
export async function GET(req: NextRequest) {
    try {
        // Get authentication from Clerk - try multiple methods
        let clerkUserId: string | null | undefined = null;
        
        // Try auth() first
        try {
            const authResult = await auth();
            clerkUserId = authResult?.userId || null;
            if (clerkUserId) {
                console.log("[Clients API GET] ✅ Got userId from auth():", clerkUserId);
            }
        } catch (authError) {
            console.warn("[Clients API GET] auth() failed:", authError);
        }
        
        // If auth() didn't work, try currentUser() as fallback
        if (!clerkUserId) {
            try {
                const user = await currentUser();
                clerkUserId = user?.id ?? null;
                if (clerkUserId) {
                    console.log("[Clients API GET] ✅ Got userId from currentUser():", clerkUserId);
                }
            } catch (userError) {
                console.warn("[Clients API GET] currentUser() failed:", userError);
            }
        }
        
        // Try to get from query params as fallback (for GET requests)
        if (!clerkUserId) {
            const searchParams = req.nextUrl.searchParams;
            const queryUserId = searchParams.get("userId");
            if (queryUserId) {
                clerkUserId = queryUserId;
                console.log("[Clients API GET] ✅ Got userId from query params:", clerkUserId);
            }
        }
        
        // Try to get from request headers as last resort (for debugging)
        if (!clerkUserId) {
            const authHeader = req.headers.get("authorization");
            const cookieHeader = req.headers.get("cookie");
            console.log("[Clients API GET] Auth header:", authHeader ? "present" : "missing");
            console.log("[Clients API GET] Cookie header:", cookieHeader ? "present" : "missing");
        }
        
        if (!clerkUserId) {
            console.warn("[Clients API GET] ❌ No userId from any auth method");
            return NextResponse.json(
                { 
                    error: "Unauthorized",
                    details: "Please sign in to access clients. If you're already signed in, please try refreshing the page."
                },
                { status: 401 }
            );
        }

        // Get user from database, create if doesn't exist
        let user = await GetUserByClerkId(clerkUserId);
        if (!user) {
            console.log(`[Clients API GET] User not found for Clerk ID: ${clerkUserId}, creating new user...`);
            // Try to get user details from Clerk
            let userEmail = `${clerkUserId}@revvy.local`;
            let userName = `User ${clerkUserId}`;
            
            try {
                const client = await clerkClient();
                const clerkUser = await client.users.getUser(clerkUserId);
                if (clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
                    userEmail = clerkUser.emailAddresses[0].emailAddress;
                }
                if (clerkUser.firstName || clerkUser.lastName) {
                    userName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || userName;
                }
                console.log(`[Clients API GET] Fetched Clerk user details - Email: ${userEmail}, Name: ${userName}`);
            } catch (clerkError) {
                console.warn("[Clients API GET] Could not fetch Clerk user details, using fallback:", clerkError);
            }
            
            // Create the user in our database
            try {
                user = await CreateOrUpdateUser(clerkUserId, userEmail, userName);
                if (!user || !user.id) {
                    console.error("[Clients API GET] CreateOrUpdateUser returned null or user without id");
                    return NextResponse.json(
                        { error: "Failed to create user account. Please try again." },
                        { status: 500 }
                    );
                }
                console.log(`[Clients API GET] ✅ User created successfully: ${user.id}`);
            } catch (createError) {
                console.error("[Clients API GET] Error creating user:", createError);
                return NextResponse.json(
                    { 
                        error: "Failed to create user account. Please try again.",
                        details: createError instanceof Error ? createError.message : String(createError)
                    },
                    { status: 500 }
                );
            }
        } else {
            console.log(`[Clients API GET] ✅ User found: ${user.id}`);
        }

        // Get all clients for this agency
        const clients = await GetClientsByAgency(user.id);

        const response = NextResponse.json({
            success: true,
            clients,
        });
        
        // Add caching headers
        response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
        
        return response;
    } catch (error) {
        console.error("[Clients API] GET Error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to fetch clients",
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/clients
 * Create a new client
 */
export async function POST(req: NextRequest) {
    try {
        // Get authentication from Clerk - try multiple methods
        let clerkUserId: string | null | undefined = null;
        
        // Try auth() first
        try {
            const authResult = await auth();
            clerkUserId = authResult?.userId || null;
            if (clerkUserId) {
                console.log("[Clients API POST] ✅ Got userId from auth():", clerkUserId);
            }
        } catch (authError) {
            console.warn("[Clients API POST] auth() failed:", authError);
        }
        
        // If auth() didn't work, try currentUser() as fallback
        if (!clerkUserId) {
            try {
                const user = await currentUser();
                clerkUserId = user?.id ?? null;
                if (clerkUserId) {
                    console.log("[Clients API POST] ✅ Got userId from currentUser():", clerkUserId);
                }
            } catch (userError) {
                console.warn("[Clients API POST] currentUser() failed:", userError);
            }
        }
        
        // Try to get from request body as fallback (for POST requests)
        let body: any = {};
        if (!clerkUserId) {
            try {
                body = await req.json();
                if (body.userId) {
                    clerkUserId = body.userId;
                    console.log("[Clients API POST] ✅ Got userId from request body:", clerkUserId);
                }
            } catch (bodyError) {
                console.warn("[Clients API POST] Could not parse request body:", bodyError);
            }
        } else {
            // If we already have userId, still need to parse body for other fields
            try {
                body = await req.json();
            } catch (bodyError) {
                console.warn("[Clients API POST] Could not parse request body:", bodyError);
            }
        }
        
        // Try to get from request headers as last resort
        if (!clerkUserId) {
            const authHeader = req.headers.get("authorization");
            const cookieHeader = req.headers.get("cookie");
            console.log("[Clients API POST] Auth header:", authHeader ? "present" : "missing");
            console.log("[Clients API POST] Cookie header:", cookieHeader ? "present" : "missing");
        }
        
        if (!clerkUserId) {
            console.warn("[Clients API POST] ❌ No userId from any auth method");
            return NextResponse.json(
                { 
                    error: "Unauthorized",
                    details: "Please sign in to create clients. If you're already signed in, please try refreshing the page."
                },
                { status: 401 }
            );
        }

        // Get user from database, create if doesn't exist
        let user = await GetUserByClerkId(clerkUserId);
        if (!user) {
            // Try to get user details from Clerk
            let userEmail = `${clerkUserId}@revvy.local`;
            let userName = `User ${clerkUserId}`;
            
            try {
                const client = await clerkClient();
                const clerkUser = await client.users.getUser(clerkUserId);
                if (clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
                    userEmail = clerkUser.emailAddresses[0].emailAddress;
                }
                if (clerkUser.firstName || clerkUser.lastName) {
                    userName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || userName;
                }
            } catch (clerkError) {
                console.warn("[Clients API] Could not fetch Clerk user details, using fallback:", clerkError);
            }
            
            // Create the user in our database
            try {
                user = await CreateOrUpdateUser(clerkUserId, userEmail, userName);
                if (!user || !user.id) {
                    return NextResponse.json(
                        { error: "Failed to create user account" },
                        { status: 500 }
                    );
                }
            } catch (createError) {
                console.error("[Clients API] Error creating user:", createError);
                return NextResponse.json(
                    { error: "Failed to create user account" },
                    { status: 500 }
                );
            }
        }
        const { name, logoUrl, status, paymentStatus, paymentDueDate } = body;

        if (!name || name.trim() === "") {
            return NextResponse.json(
                { error: "Client name is required" },
                { status: 400 }
            );
        }

        // Create client
        try {
            const client = await CreateClient({
                agencyId: user.id,
                name: name.trim(),
                logoUrl,
                status,
                paymentStatus,
                paymentDueDate: paymentDueDate ? new Date(paymentDueDate) : undefined,
            });

            console.log(`[Clients API] ✅ Client created successfully: ${client.id}`);

            return NextResponse.json({
                success: true,
                client,
                message: "Client created successfully",
            });
        } catch (createError) {
            console.error("[Clients API] Error creating client:", createError);
            return NextResponse.json(
                {
                    error: "Failed to create client. Please try again.",
                    details: createError instanceof Error ? createError.message : String(createError)
                },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("[Clients API] POST Error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to create client",
                details: error instanceof Error ? error.stack : String(error)
            },
            { status: 500 }
        );
    }
}
