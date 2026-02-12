import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/utils/db/dbConfig";
import { GeneratedContent } from "@/utils/db/schema";
import { eq } from "drizzle-orm";
import { GetUserByClerkId } from "@/utils/db/actions";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Parse query params to get client userId as fallback
    const { searchParams } = new URL(req.url);
    const clientUserId = searchParams.get("userId");
    
    // Try multiple methods to get the user ID (same pattern as other routes)
    const authResult = await auth();
    let clerkUserId: string | null | undefined = authResult?.userId ?? null;
    
    // If auth() didn't work, try currentUser()
    if (!clerkUserId) {
      try {
        const user = await currentUser();
        clerkUserId = user?.id ?? null;
      } catch (userError) {
        console.warn("currentUser() failed:", userError);
      }
    }
    
    // Use clientUserId as final fallback if provided
    if (!clerkUserId && clientUserId) {
      clerkUserId = clientUserId;
    }

    if (!clerkUserId) {
      console.error("[Delete API] No userId found - auth failed");
      console.error("[Delete API] Auth result:", authResult);
      return NextResponse.json(
        { error: "Unauthorized", details: "Please sign in to delete content. If you're already signed in, please try refreshing the page." },
        { status: 401 }
      );
    }

    console.log("[Delete API] Authenticated user:", clerkUserId);

    const user = await GetUserByClerkId(clerkUserId);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Handle both Promise and direct params (Next.js 14 vs 15)
    const resolvedParams = params instanceof Promise ? await params : params;
    const contentId = parseInt(resolvedParams.id);

    const [content] = await db
      .select()
      .from(GeneratedContent)
      .where(eq(GeneratedContent.id, contentId))
      .limit(1)
      .execute();

    if (!content) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    if (content.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    await db
      .delete(GeneratedContent)
      .where(eq(GeneratedContent.id, contentId))
      .execute();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting content:", error);
    return NextResponse.json(
      { error: "Failed to delete content" },
      { status: 500 }
    );
  }
}

