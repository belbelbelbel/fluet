/**
 * Reports API – list and create client reports
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  GetUserByClerkId,
  GetClientById,
  GetClientsByAgency,
  CreateClientReport,
  GetClientReportsForAgency,
} from "@/utils/db/actions";

export const dynamic = "force-dynamic";

async function getClerkUserId(req: NextRequest): Promise<string | null> {
  try {
    const { userId } = await auth();
    if (userId) return userId;
  } catch {
    // ignore
  }
  try {
    const user = await currentUser();
    if (user?.id) return user.id;
  } catch {
    // ignore
  }
  const q = req.nextUrl.searchParams.get("userId");
  return q || null;
}

/**
 * GET /api/reports?clientId= optional
 * List reports for the authenticated agency.
 */
export async function GET(req: NextRequest) {
  try {
    const clerkUserId = await getClerkUserId(req);
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await GetUserByClerkId(clerkUserId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const agencyId = user.id;
    const clientIdParam = req.nextUrl.searchParams.get("clientId");
    const clientId =
      clientIdParam !== null && clientIdParam !== ""
        ? parseInt(clientIdParam, 10)
        : undefined;
    if (clientIdParam !== null && clientIdParam !== "" && isNaN(clientId as number)) {
      return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
    }

    const reports = await GetClientReportsForAgency(agencyId, clientId ?? null);
    const clientIds = [...new Set(reports.map((r) => r.clientId))];
    const clients = await GetClientsByAgency(agencyId);
    const clientMap = new Map(clients.map((c) => [c.id, c]));

    const list = reports.map((r) => ({
      id: r.id,
      clientId: r.clientId,
      clientName: clientMap.get(r.clientId)?.name ?? `Client #${r.clientId}`,
      periodStart: r.periodStart,
      periodEnd: r.periodEnd,
      reportData: r.reportData,
      pdfUrl: r.pdfUrl ?? undefined,
      sentToClient: r.sentToClient ?? false,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ reports: list });
  } catch (error) {
    console.error("[Reports API GET]", error);
    return NextResponse.json(
      { error: "Failed to load reports" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports
 * Body: { clientId: number, periodStart?: string (YYYY-MM-DD), periodEnd?: string }
 * Default period: last 30 days.
 * Create a new report for the given client and period.
 */
export async function POST(req: NextRequest) {
  try {
    let clerkUserId = await getClerkUserId(req);
    const body = await req.json().catch(() => ({}));
    if (!clerkUserId && body.userId) clerkUserId = body.userId;
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await GetUserByClerkId(clerkUserId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const clientId = typeof body.clientId === "number" ? body.clientId : parseInt(body.clientId, 10);
    if (!Number.isInteger(clientId) || clientId < 1) {
      return NextResponse.json(
        { error: "clientId is required and must be a positive number" },
        { status: 400 }
      );
    }

    const client = await GetClientById(clientId, user.id);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const now = new Date();
    let periodEnd = new Date(now);
    periodEnd.setHours(23, 59, 59, 999);
    let periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - 30);
    periodStart.setHours(0, 0, 0, 0);

    if (typeof body.periodEnd === "string" && body.periodEnd) {
      const parsed = new Date(body.periodEnd);
      if (!isNaN(parsed.getTime())) periodEnd = parsed;
    }
    if (typeof body.periodStart === "string" && body.periodStart) {
      const parsed = new Date(body.periodStart);
      if (!isNaN(parsed.getTime())) periodStart = parsed;
    }

    const report = await CreateClientReport(user.id, clientId, periodStart, periodEnd);
    const reportPayload = {
      id: report.id,
      clientId: report.clientId,
      clientName: client.name,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      reportData: report.reportData,
      pdfUrl: report.pdfUrl ?? undefined,
      sentToClient: report.sentToClient ?? false,
      createdAt: report.createdAt,
    };

    return NextResponse.json({ report: reportPayload });
  } catch (error) {
    console.error("[Reports API POST]", error);
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}
