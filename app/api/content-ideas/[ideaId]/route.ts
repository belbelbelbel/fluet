/**
 * Look up a content idea by ID (from database or cache)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { contentIdeasDatabase } from "@/lib/content-ideas";
import { GetCachedIdeaById } from "@/utils/db/actions";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { ideaId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ideaId = params.ideaId;
    if (!ideaId) {
      return NextResponse.json({ error: "Idea ID required" }, { status: 400 });
    }

    const fromDb = contentIdeasDatabase.find((i) => i.id === ideaId);
    if (fromDb) {
      return NextResponse.json({ success: true, idea: fromDb, source: "database" });
    }

    if (ideaId.startsWith("cache_")) {
      const fromCache = await GetCachedIdeaById(ideaId);
      if (fromCache) {
        return NextResponse.json({ success: true, idea: fromCache, source: "cache" });
      }
    }

    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  } catch (error) {
    console.error("[Content Ideas Lookup] Error:", error);
    return NextResponse.json(
      { error: "Failed to lookup idea" },
      { status: 500 }
    );
  }
}
