/**
 * Internal API: Agency AI Cost & Margin Visibility
 * Returns AI cost per agency for current month. Protected by INTERNAL_API_SECRET or CRON_SECRET.
 * For internal dashboard / operational visibility only.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/dbConfig";
import { GeneratedContent, Users } from "@/utils/db/schema";
import { eq, gte, sql } from "drizzle-orm";
import { GetUserSubscription } from "@/utils/db/actions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const secret = req.nextUrl.searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET;
    const internalSecret = process.env.INTERNAL_API_SECRET;
    const validSecret = cronSecret || internalSecret;

    if (!validSecret || secret !== validSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await db
      .select({
        userId: GeneratedContent.userId,
        userName: Users.name,
        userEmail: Users.email,
        totalCostUsd: sql<number>`COALESCE(SUM(${GeneratedContent.aiCostUsd}), 0)::real`,
        totalTokens: sql<number>`COALESCE(SUM(${GeneratedContent.aiTokensUsed}), 0)::int`,
        generationCount: sql<number>`count(*)::int`,
      })
      .from(GeneratedContent)
      .innerJoin(Users, eq(GeneratedContent.userId, Users.id))
      .where(gte(GeneratedContent.createdAt, startOfMonth))
      .groupBy(GeneratedContent.userId, Users.name, Users.email)
      .orderBy(sql`COALESCE(SUM(${GeneratedContent.aiCostUsd}), 0) DESC`)
      .execute();

    const agencies = await Promise.all(
      result.map(async (r) => {
        const sub = await GetUserSubscription(r.userId);
        return {
          agencyId: r.userId,
          name: r.userName,
          email: r.userEmail,
          plan: sub?.plan?.toLowerCase() || "free",
          aiCostUsd: Number(r.totalCostUsd) || 0,
          aiTokens: Number(r.totalTokens) || 0,
          generations: Number(r.generationCount) || 0,
        };
      })
    );

    const totalCost = agencies.reduce((sum, a) => sum + a.aiCostUsd, 0);

    return NextResponse.json({
      period: "current_month",
      startDate: startOfMonth.toISOString(),
      agencies,
      summary: {
        totalAgencies: agencies.length,
        totalAiCostUsd: totalCost,
      },
    });
  } catch (error) {
    console.error("[Internal API] Agency costs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch agency costs" },
      { status: 500 }
    );
  }
}
