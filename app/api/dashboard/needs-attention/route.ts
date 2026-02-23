/**
 * GET /api/dashboard/needs-attention
 * Returns clients that need agency attention: pending approvals, overdue payments, credits warnings.
 * Used for the "Needs Attention" triage panel on the dashboard.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/utils/db/dbConfig";
import { PostApprovals, Clients, ClientCredits } from "@/utils/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { GetUserByClerkId } from "@/utils/db/actions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    let clerkUserId: string | null = null;
    try {
      const authResult = await auth();
      clerkUserId = authResult?.userId ?? null;
    } catch {
      const user = await currentUser();
      clerkUserId = user?.id ?? null;
    }
    const queryUserId = req.nextUrl.searchParams.get("userId");
    clerkUserId = clerkUserId ?? queryUserId;

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await GetUserByClerkId(clerkUserId);
    if (!user) {
      return NextResponse.json({ pendingApprovals: [], overduePayments: [], creditsWarnings: [] });
    }

    // Pending approvals (posts awaiting client approval) - grouped by client
    const pendingApprovalRows = await db
      .select({
        clientId: PostApprovals.clientId,
        count: sql<number>`count(*)::int`,
        clientName: Clients.name,
      })
      .from(PostApprovals)
      .innerJoin(Clients, eq(PostApprovals.clientId, Clients.id))
      .where(
        and(
          eq(PostApprovals.status, "pending"),
          eq(Clients.agencyId, user.id)
        )
      )
      .groupBy(PostApprovals.clientId, Clients.name)
      .orderBy(desc(sql`count(*)`))
      .limit(5)
      .execute();

    const pendingApprovals = pendingApprovalRows.map((r) => ({
      clientId: r.clientId,
      clientName: r.clientName,
      count: r.count,
    }));

    // Overdue payments
    const overduePayments = await db
      .select({ id: Clients.id, name: Clients.name })
      .from(Clients)
      .where(
        and(
          eq(Clients.agencyId, user.id),
          eq(Clients.paymentStatus, "overdue")
        )
      )
      .orderBy(desc(Clients.updatedAt))
      .limit(5)
      .execute();

    // Credits warnings (80%+ used, excluding 100% which is in credits_exceeded)
    const creditsRows = await db
      .select({
        clientId: ClientCredits.clientId,
        name: Clients.name,
        postsUsed: ClientCredits.postsUsed,
        postsPerMonth: ClientCredits.postsPerMonth,
      })
      .from(ClientCredits)
      .innerJoin(Clients, eq(ClientCredits.clientId, Clients.id))
      .where(eq(Clients.agencyId, user.id))
      .execute();

    const creditsWarnings = creditsRows
      .map((row) => {
        const limit = row.postsPerMonth ?? 12;
        const used = row.postsUsed ?? 0;
        const pct = limit > 0 ? (used / limit) * 100 : 0;
        if (pct >= 80 && pct < 100) {
          return {
            clientId: row.clientId,
            clientName: row.name,
            percentage: Math.round(pct),
          };
        }
        return null;
      })
      .filter(Boolean) as { clientId: number; clientName: string; percentage: number }[];

    return NextResponse.json({
      pendingApprovals,
      overduePayments: overduePayments.map((c) => ({
        clientId: c.id,
        clientName: c.name,
      })),
      creditsWarnings: creditsWarnings.slice(0, 5),
    });
  } catch (error) {
    console.error("[Needs Attention API] Error:", error);
    return NextResponse.json(
      { pendingApprovals: [], overduePayments: [], creditsWarnings: [] },
      { status: 200 }
    );
  }
}
