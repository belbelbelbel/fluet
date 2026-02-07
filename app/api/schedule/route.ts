import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { GetUserByClerkId, CreateScheduledPost, GetUserScheduledPosts, DeleteScheduledPost, UpdateScheduledPost } from "@/utils/db/actions";

export const dynamic = "force-dynamic";

// Get all scheduled posts
export async function GET(req: Request) {
  try {
    // Parse query params first to get client userId (same pattern as generate API)
    const { searchParams } = new URL(req.url);
    const clientUserId = searchParams.get("userId");

    // Use the EXACT same auth pattern as generate API (which works)
    const authResult = await auth();
    let clerkUserId = authResult?.userId || clientUserId || null;
    
    // If auth() didn't work, try currentUser() as fallback
    if (!clerkUserId) {
      try {
        const user = await currentUser();
        clerkUserId = user?.id || null;
        console.log("[Schedule API GET] currentUser() fallback result:", { userId: clerkUserId });
      } catch (userError) {
        console.warn("[Schedule API GET] currentUser() failed:", userError);
      }
    }

    // Log authentication status for debugging
    if (!clerkUserId) {
      console.warn("[Schedule API GET] ⚠️ No userId found - auth failed, trying fallbacks");
      console.warn("[Schedule API GET] Client userId from query:", clientUserId);
    }

    if (!clerkUserId) {
      console.warn("[Schedule API GET] No userId - returning empty array");
      return NextResponse.json([]);
    }

    console.log("[Schedule API GET] ✅ Authenticated Clerk user ID:", clerkUserId);

    const user = await GetUserByClerkId(clerkUserId);
    if (!user) {
      console.log("[Schedule API GET] User not found in database - returning empty array");
      return NextResponse.json([]);
    }

    console.log("[Schedule API GET] ✅ Found user: DB ID", user.id);
    const scheduledPosts = await GetUserScheduledPosts(user.id);
    console.log("[Schedule API GET] ✅ Returning", scheduledPosts.length, "scheduled posts");
    return NextResponse.json(scheduledPosts);
  } catch (error) {
    console.error("Error fetching scheduled posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch scheduled posts" },
      { status: 500 }
    );
  }
}

// Create a new scheduled post
export async function POST(req: Request) {
  try {
    // Parse body first to get client userId (same pattern as generate API)
    const body = await req.json();
    const { contentId, platform, content, scheduledFor, userId: clientUserId } = body;

    // Use the EXACT same auth pattern as generate API (which works)
    const authResult = await auth();
    let clerkUserId = authResult?.userId || clientUserId || null;
    
    // If auth() didn't work, try currentUser() as fallback
    if (!clerkUserId) {
      try {
        const user = await currentUser();
        clerkUserId = user?.id || null;
        console.log("[Schedule API POST] currentUser() fallback result:", { userId: clerkUserId });
      } catch (userError) {
        console.warn("[Schedule API POST] currentUser() failed:", userError);
      }
    }

    // Log authentication status for debugging
    if (!clerkUserId) {
      console.warn("[Schedule API POST] ⚠️ No userId found - auth failed, trying fallbacks");
      console.warn("[Schedule API POST] Auth result:", { hasAuthResult: !!authResult, userId: authResult?.userId });
      console.warn("[Schedule API POST] Client userId from body:", clientUserId);
    }

    if (!clerkUserId) {
      console.error("[Schedule API POST] ❌ No userId - cannot schedule post");
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    console.log("[Schedule API POST] ✅ Authenticated Clerk user ID:", clerkUserId);

    if (!platform || !content || !scheduledFor) {
      return NextResponse.json(
        { error: "Missing required fields: platform, content, scheduledFor" },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(scheduledFor);
    if (isNaN(scheduledDate.getTime()) || scheduledDate < new Date()) {
      return NextResponse.json(
        { error: "Invalid scheduled date. Must be in the future." },
        { status: 400 }
      );
    }

    const user = await GetUserByClerkId(clerkUserId);
    if (!user) {
      console.error("[Schedule API POST] ❌ User not found in database for Clerk ID:", clerkUserId);
      return NextResponse.json(
        { error: "User not found. Please generate content first to create your account." },
        { status: 404 }
      );
    }

    console.log("[Schedule API POST] ✅ Found user: DB ID", user.id);
    const scheduledPost = await CreateScheduledPost(
      user.id,
      contentId || null,
      platform,
      content,
      scheduledDate
    );

    return NextResponse.json(scheduledPost);
  } catch (error) {
    console.error("Error creating scheduled post:", error);
    return NextResponse.json(
      { error: "Failed to create scheduled post" },
      { status: 500 }
    );
  }
}

// Update a scheduled post
export async function PUT(req: Request) {
  try {
    // Parse body first to get client userId (same pattern as generate API)
    const body = await req.json();
    const { id, content, scheduledFor, platform, userId: clientUserId } = body;

    // Use the EXACT same auth pattern as generate API (which works)
    const authResult = await auth();
    let clerkUserId = authResult?.userId || clientUserId || null;
    
    // If auth() didn't work, try currentUser() as fallback
    if (!clerkUserId) {
      try {
        const user = await currentUser();
        clerkUserId = user?.id || null;
        console.log("[Schedule API PUT] currentUser() fallback result:", { userId: clerkUserId });
      } catch (userError) {
        console.warn("[Schedule API PUT] currentUser() failed:", userError);
      }
    }

    // Log authentication status for debugging
    if (!clerkUserId) {
      console.warn("[Schedule API PUT] ⚠️ No userId found - auth failed, trying fallbacks");
    }

    if (!clerkUserId) {
      console.error("[Schedule API PUT] ❌ No userId - cannot update post");
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    console.log("[Schedule API PUT] ✅ Authenticated Clerk user ID:", clerkUserId);

    if (!id) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const user = await GetUserByClerkId(clerkUserId);
    if (!user) {
      console.error("[Schedule API PUT] ❌ User not found in database");
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.log("[Schedule API PUT] ✅ Found user: DB ID", user.id);
    const updates: Partial<{ content: string; scheduledFor: Date; platform: string }> = {};
    if (content) updates.content = content;
    if (scheduledFor) {
      const scheduledDate = new Date(scheduledFor);
      if (isNaN(scheduledDate.getTime()) || scheduledDate < new Date()) {
        return NextResponse.json(
          { error: "Invalid scheduled date. Must be in the future." },
          { status: 400 }
        );
      }
      updates.scheduledFor = scheduledDate;
    }
    if (platform) updates.platform = platform;

    const updatedPost = await UpdateScheduledPost(id, user.id, updates);
    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("Error updating scheduled post:", error);
    return NextResponse.json(
      { error: "Failed to update scheduled post" },
      { status: 500 }
    );
  }
}

// Delete a scheduled post
export async function DELETE(req: Request) {
  try {
    // Parse query params first to get client userId (same pattern as generate API)
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const clientUserId = searchParams.get("userId");

    // Use the EXACT same auth pattern as generate API (which works)
    const authResult = await auth();
    let clerkUserId = authResult?.userId || clientUserId || null;
    
    // If auth() didn't work, try currentUser() as fallback
    if (!clerkUserId) {
      try {
        const user = await currentUser();
        clerkUserId = user?.id || null;
        console.log("[Schedule API DELETE] currentUser() fallback result:", { userId: clerkUserId });
      } catch (userError) {
        console.warn("[Schedule API DELETE] currentUser() failed:", userError);
      }
    }

    // Log authentication status for debugging
    if (!clerkUserId) {
      console.warn("[Schedule API DELETE] ⚠️ No userId found - auth failed, trying fallbacks");
    }

    if (!clerkUserId) {
      console.error("[Schedule API DELETE] ❌ No userId - cannot delete post");
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    console.log("[Schedule API DELETE] ✅ Authenticated Clerk user ID:", clerkUserId);

    if (!id) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const user = await GetUserByClerkId(clerkUserId);
    if (!user) {
      console.error("[Schedule API DELETE] ❌ User not found in database");
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.log("[Schedule API DELETE] ✅ Found user: DB ID", user.id);
    await DeleteScheduledPost(parseInt(id), user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting scheduled post:", error);
    return NextResponse.json(
      { error: "Failed to delete scheduled post" },
      { status: 500 }
    );
  }
}

