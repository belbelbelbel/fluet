/**
 * Client portal preferences (notifications + notes for the agency)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/utils/db/dbConfig";
import { Clients } from "@/utils/db/schema";
import { eq } from "drizzle-orm";
import { getUserRoleData } from "@/utils/auth/roles";

export const dynamic = "force-dynamic";

type PortalPreferences = {
  emailApprovals: boolean;
  emailReminders: boolean;
  notes: string;
};

const defaults: PortalPreferences = {
  emailApprovals: true,
  emailReminders: true,
  notes: "",
};

async function resolveClerkId() {
  try {
    const authResult = await auth();
    if (authResult?.userId) return authResult.userId;
  } catch {
    /* ignore */
  }
  try {
    const user = await currentUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

async function assertClientUser(clerkUserId: string, clientId: number) {
  const roleData = await getUserRoleData(clerkUserId);
  if (!roleData || roleData.role !== "client" || roleData.clientId !== clientId) {
    return false;
  }
  return true;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> | { clientId: string } }
) {
  try {
    const resolved = params instanceof Promise ? await params : params;
    const clientId = parseInt(resolved.clientId, 10);
    if (Number.isNaN(clientId)) {
      return NextResponse.json({ error: "Invalid client" }, { status: 400 });
    }

    const clerkUserId = await resolveClerkId();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(await assertClientUser(clerkUserId, clientId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [row] = await db
      .select({ portalPreferences: Clients.portalPreferences })
      .from(Clients)
      .where(eq(Clients.id, clientId))
      .limit(1)
      .execute();

    const prefs = {
      ...defaults,
      ...((row?.portalPreferences as Partial<PortalPreferences>) || {}),
    };

    return NextResponse.json({ preferences: prefs });
  } catch (error) {
    console.error("[Client preferences GET]", error);
    return NextResponse.json({ error: "Failed to load preferences" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> | { clientId: string } }
) {
  try {
    const resolved = params instanceof Promise ? await params : params;
    const clientId = parseInt(resolved.clientId, 10);
    if (Number.isNaN(clientId)) {
      return NextResponse.json({ error: "Invalid client" }, { status: 400 });
    }

    const clerkUserId = await resolveClerkId();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(await assertClientUser(clerkUserId, clientId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const preferences: PortalPreferences = {
      emailApprovals: body.emailApprovals !== false,
      emailReminders: body.emailReminders !== false,
      notes: typeof body.notes === "string" ? body.notes.slice(0, 2000) : "",
    };

    await db
      .update(Clients)
      .set({
        portalPreferences: preferences,
        updatedAt: new Date(),
      })
      .where(eq(Clients.id, clientId))
      .execute();

    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    console.error("[Client preferences PUT]", error);
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  }
}
