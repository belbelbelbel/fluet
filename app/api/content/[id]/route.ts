import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/utils/db/dbConfig";
import { GeneratedContent } from "@/utils/db/schema";
import { eq } from "drizzle-orm";
import { GetUserByClerkId } from "@/utils/db/actions";

export async function DELETE(
  req: Request,
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

    const contentId = parseInt(params.id);

    // Verify content belongs to user
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

    // Delete content
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

