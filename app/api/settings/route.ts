import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Get authentication from Clerk - try multiple methods (same pattern as other routes)
    const authResult = await auth();
    let userId: string | null | undefined = authResult?.userId || null;
    
    // If auth() didn't work, try currentUser() as fallback
    if (!userId) {
      try {
        const user = await currentUser();
        userId = user?.id ?? null;
      } catch (userError) {
        console.warn("[Settings API] currentUser() failed:", userError);
      }
    }
    
    if (!userId) {
      console.warn("[Settings API] No userId from auth()");
      return NextResponse.json({ error: "Unauthorized - Please sign in" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const requestedUserId = searchParams.get("userId");

    // If no userId in query, use the authenticated userId
    if (!requestedUserId) {
      // Return settings for authenticated user
      return NextResponse.json({
        defaultAIModel: "gpt-4o-mini",
        autoSave: true,
        notifications: true,
        theme: "light",
      });
    }

    if (requestedUserId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // TODO: Fetch from database when settings table is created
    // For now, return defaults
    return NextResponse.json({
      defaultAIModel: "gpt-4o-mini",
      autoSave: true,
      notifications: true,
      theme: "dark",
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get authentication from Clerk - try multiple methods (same pattern as other routes)
    const authResult = await auth();
    let userId: string | null | undefined = authResult?.userId || null;
    
    // If auth() didn't work, try currentUser() as fallback
    if (!userId) {
      try {
        const user = await currentUser();
        userId = user?.id ?? null;
      } catch (userError) {
        console.warn("[Settings API] currentUser() failed:", userError);
      }
    }
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized - Please sign in" }, { status: 401 });
    }

    const { userId: requestedUserId, settings } = await req.json();

    if (requestedUserId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // TODO: Save to database when settings table is created
    // For now, just return success
    console.log("Settings to save:", settings);

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully",
    });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}

