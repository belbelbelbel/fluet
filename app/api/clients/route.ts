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
        // Always return JSON, never HTML
        try {
            return NextResponse.json(
                {
                    error: error instanceof Error ? error.message : "Failed to fetch clients",
                    details: error instanceof Error ? error.stack : String(error)
                },
                { status: 500 }
            );
        } catch (jsonError) {
            // If even JSON.stringify fails, return minimal JSON
            return new NextResponse(
                JSON.stringify({ error: "Internal server error" }),
                { 
                    status: 500,
                    headers: { "Content-Type": "application/json" }
                }
            );
        }
    }
}

/**
 * POST /api/clients
 * Create a new client
 */
export async function POST(req: NextRequest) {
    // Wrap everything to ensure we always return JSON
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
        
        // Parse request body once (can only be read once)
        let body: any = {};
        try {
            body = await req.json();
            // If we don't have userId from auth, try to get it from body
            if (!clerkUserId && body.userId) {
                clerkUserId = body.userId;
                console.log("[Clients API POST] ✅ Got userId from request body:", clerkUserId);
            }
        } catch (bodyError) {
            console.warn("[Clients API POST] Could not parse request body:", bodyError);
            // If body parsing fails, return error immediately
            return NextResponse.json(
                { 
                    error: "Invalid request body",
                    details: "Could not parse request data. Please check your input."
                },
                { status: 400 }
            );
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
                    console.error("[Clients API POST] CreateOrUpdateUser returned null or user without id");
                    return NextResponse.json(
                        { 
                            error: "Failed to create user account",
                            details: "User creation returned invalid data"
                        },
                        { 
                            status: 500,
                            headers: { "Content-Type": "application/json" }
                        }
                    );
                }
                console.log(`[Clients API POST] ✅ User created/updated successfully: ${user.id}`);
            } catch (createError) {
                console.error("[Clients API POST] Error creating user:", createError);
                const errorMessage = createError instanceof Error ? createError.message : String(createError);
                return NextResponse.json(
                    { 
                        error: "Failed to create user account",
                        details: errorMessage
                    },
                    { 
                        status: 500,
                        headers: { "Content-Type": "application/json" }
                    }
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
            console.log(`[Clients API POST] Creating client for agency ${user.id} with name: ${name.trim()}`);
            
            // Validate user has an ID
            if (!user || !user.id) {
                console.error("[Clients API POST] User object is invalid:", user);
                return NextResponse.json(
                    {
                        error: "Invalid user account",
                        details: "User account is missing required information"
                    },
                    { status: 500 }
                );
            }
            
            const client = await CreateClient({
                agencyId: user.id,
                name: name.trim(),
                logoUrl: logoUrl?.trim() || undefined,
                status: status || "active",
                paymentStatus: paymentStatus || "paid",
                paymentDueDate: paymentDueDate ? new Date(paymentDueDate) : undefined,
            });

            if (!client || !client.id) {
                console.error("[Clients API POST] CreateClient returned null or client without id");
                return NextResponse.json(
                    {
                        error: "Failed to create client",
                        details: "Client creation returned invalid data"
                    },
                    { status: 500 }
                );
            }

            console.log(`[Clients API POST] ✅ Client created successfully: ${client.id}`);

            return NextResponse.json({
                success: true,
                client,
                message: "Client created successfully",
            }, {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store"
                }
            });
        } catch (createError) {
            console.error("[Clients API POST] Error creating client:", createError);
            // Always return JSON, never HTML
            try {
                const errorMessage = createError instanceof Error ? createError.message : String(createError);
                const errorDetails = createError instanceof Error && createError.stack 
                    ? createError.stack.substring(0, 500) 
                    : undefined;
                
                return NextResponse.json(
                    {
                        error: "Failed to create client",
                        details: errorMessage,
                        ...(process.env.NODE_ENV === "development" && errorDetails ? { stack: errorDetails } : {})
                    },
                    { 
                        status: 500,
                        headers: {
                            "Content-Type": "application/json",
                            "Cache-Control": "no-store"
                        }
                    }
                );
            } catch (jsonError) {
                // If even JSON.stringify fails, return minimal JSON
                console.error("[Clients API POST] Failed to create JSON response:", jsonError);
                return new Response(
                    JSON.stringify({ error: "Internal server error" }),
                    { 
                        status: 500,
                        headers: { 
                            "Content-Type": "application/json",
                            "Cache-Control": "no-store"
                        }
                    }
                );
            }
        }
    } catch (error) {
        console.error("[Clients API POST] Top-level error:", error);
        // Always return JSON, never HTML - this is critical
        try {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;
            
            console.error("[Clients API POST] Error details:", {
                message: errorMessage,
                stack: errorStack?.substring(0, 500), // Limit stack trace length
            });
            
            return NextResponse.json(
                {
                    error: "Failed to create client",
                    details: errorMessage,
                    // Only include stack in development
                    ...(process.env.NODE_ENV === "development" && errorStack ? { stack: errorStack } : {})
                },
                { 
                    status: 500,
                    headers: { 
                        "Content-Type": "application/json",
                        "Cache-Control": "no-store"
                    }
                }
            );
        } catch (jsonError) {
            // If even JSON.stringify fails, return minimal JSON using raw Response
            console.error("[Clients API POST] Failed to create JSON response:", jsonError);
            return new Response(
                JSON.stringify({ error: "Internal server error" }),
                { 
                    status: 500,
                    headers: { 
                        "Content-Type": "application/json",
                        "Cache-Control": "no-store"
                    }
                }
            );
        }
    }
}
