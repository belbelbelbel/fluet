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
      } catch (userError) {
        // Silent fallback
      }
    }

    if (!clerkUserId) {
      return NextResponse.json([]);
    }

    const user = await GetUserByClerkId(clerkUserId);
    if (!user) {
      return NextResponse.json([]);
    }

    const scheduledPosts = await GetUserScheduledPosts(user.id);
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
      } catch (userError) {
        // Silent fallback
      }
    }

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

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
      return NextResponse.json(
        { error: "User not found. Please generate content first to create your account." },
        { status: 404 }
      );
    }
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
      } catch (userError) {
        // Silent fallback
      }
    }

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const user = await GetUserByClerkId(clerkUserId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
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
      } catch (userError) {
        // Silent fallback
      }
    }

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const user = await GetUserByClerkId(clerkUserId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
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

