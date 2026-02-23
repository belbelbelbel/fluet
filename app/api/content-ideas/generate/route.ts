/**
 * AI-generated content ideas for custom niches
 * Uses strategic frameworks, caches by niche string, enforces per-client refresh limits
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateContentIdeasForNiche } from "@/utils/ai/idea-generator";
import {
  GetClientById,
  GetUserByClerkId,
  GetClientBrandVoice,
  GetIdeasFromCache,
  UpsertIdeasCache,
  RecordClientIdeaRefresh,
} from "@/utils/db/actions";
import { normalizeNicheString } from "@/lib/content-ideas";
import { getIdeaRefreshLimitForClient } from "@/utils/subscription/limits";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await GetUserByClerkId(clerkUserId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { clientId: clientIdParam, forceRefresh } = body;
    const clientId = clientIdParam != null ? parseInt(String(clientIdParam), 10) : null;
    const validClientId = Number.isNaN(clientId) ? null : clientId;

    if (!validClientId) {
      return NextResponse.json(
        { error: "Client ID required for AI idea generation" },
        { status: 400 }
      );
    }

    const client = await GetClientById(validClientId, user.id);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const brandVoice = await GetClientBrandVoice(validClientId);
    const nicheDescription =
      brandVoice?.nicheDescription?.trim() ||
      brandVoice?.industry?.trim() ||
      "";
    if (!nicheDescription) {
      return NextResponse.json(
        {
          error: "Niche required",
          details: "Set Primary Industry + Specific Niche in Brand Voice first",
        },
        { status: 400 }
      );
    }

    const normalized = normalizeNicheString(nicheDescription);
    if (!normalized) {
      return NextResponse.json(
        { error: "Please provide a specific niche description" },
        { status: 400 }
      );
    }

    const refreshLimits = await getIdeaRefreshLimitForClient(validClientId);
    if (!forceRefresh) {
      const cached = await GetIdeasFromCache(normalized);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return NextResponse.json({
          success: true,
          ideas: cached,
          source: "cache",
          refreshLimits,
        });
      }
    }

    if (!refreshLimits.canRefresh) {
      return NextResponse.json(
        {
          error: "Idea refresh limit reached",
          details: `You've used all ${refreshLimits.used} idea refreshes for this client this month. Upgrade your plan for more, or wait for the next month.`,
          refreshLimits,
        },
        { status: 403 }
      );
    }

    const { ideas } = await generateContentIdeasForNiche(nicheDescription);
    const ideasAsRecords = ideas.map((idea) => ({ ...idea })) as Record<string, unknown>[];

    await UpsertIdeasCache(normalized, ideasAsRecords);
    await RecordClientIdeaRefresh(validClientId, normalized);

    const updatedLimits = await getIdeaRefreshLimitForClient(validClientId);

    return NextResponse.json({
      success: true,
      ideas: ideasAsRecords,
      source: "ai",
      refreshLimits: updatedLimits,
    });
  } catch (error) {
    console.error("[Content Ideas Generate API] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate ideas",
        details: error instanceof Error ? error.message : "Please try again",
      },
      { status: 500 }
    );
  }
}

/** GET: Check cache and refresh limits (no generation) */
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await GetUserByClerkId(clerkUserId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = parseInt(searchParams.get("clientId") ?? "0", 10);
    if (!clientId) {
      return NextResponse.json({ error: "clientId required" }, { status: 400 });
    }

    const client = await GetClientById(clientId, user.id);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const brandVoice = await GetClientBrandVoice(clientId);
    const nicheDescription =
      brandVoice?.nicheDescription?.trim() || brandVoice?.industry?.trim() || "";
    const normalized = normalizeNicheString(nicheDescription);

    let cachedIdeas: Record<string, unknown>[] | null = null;
    if (normalized) {
      cachedIdeas = await GetIdeasFromCache(normalized);
    }

    const refreshLimits = await getIdeaRefreshLimitForClient(clientId);

    return NextResponse.json({
      success: true,
      cachedIdeas: Array.isArray(cachedIdeas) && cachedIdeas.length > 0 ? cachedIdeas : null,
      refreshLimits,
      hasNiche: !!normalized,
    });
  } catch (error) {
    console.error("[Content Ideas Generate API] GET Error:", error);
    return NextResponse.json(
      { error: "Failed to check ideas" },
      { status: 500 }
    );
  }
}
