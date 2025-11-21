import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { GetUserByClerkId, GetUserGeneratedContent } from "@/utils/db/actions";

// Mark route as dynamic
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";

    const user = await GetUserByClerkId(clerkUserId);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    let content = await GetUserGeneratedContent(user.id, 100);


    if (filter !== "all") {
      content = content.filter((item) => item.contentType === filter);
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

