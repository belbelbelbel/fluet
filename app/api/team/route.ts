import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  GetUserByClerkId,
  GetAgencyTeamMembers,
  GetTeamInvitationsByInviter,
  GetClientAssignmentsForAgency,
  GetClientsByAgency,
} from "@/utils/db/actions";
import {
  resolveAgencyContext,
  canManageTeam,
  getAccessibleClients,
} from "@/lib/team-access";
import { db } from "@/utils/db/dbConfig";
import { Users } from "@/utils/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const queryUserId = searchParams.get("userId");

    const authResult = await auth();
    let clerkUserId: string | null | undefined = authResult?.userId || queryUserId || null;

    if (!clerkUserId) {
      try {
        const user = await currentUser();
        clerkUserId = user?.id ?? null;
      } catch (userError) {
        console.warn("[Team API] currentUser() failed:", userError);
      }
    }

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized - Please sign in" }, { status: 401 });
    }

    const user = await GetUserByClerkId(clerkUserId);
    if (!user || !user.id) {
      return NextResponse.json({ members: [], sentInvitations: [], clients: [] });
    }

    const ctx = await resolveAgencyContext(clerkUserId);
    if (!ctx) {
      return NextResponse.json({ members: [], sentInvitations: [], clients: [] });
    }

    const agencyId = ctx.agencyId;

    let clients: { id: number; name: string }[] = [];
    try {
      if (canManageTeam(ctx.role) || ctx.role === "manager") {
        const owned = await GetClientsByAgency(agencyId);
        clients = owned.map((c) => ({ id: c.id, name: c.name }));
      } else {
        const accessible = await getAccessibleClients(ctx);
        clients = accessible.map((c) => ({ id: c.id, name: c.name }));
      }
    } catch {
      /* ignore */
    }

    const assignmentsByUser = new Map<
      number,
      { clientId: number; clientName: string }[]
    >();
    try {
      const assignments = await GetClientAssignmentsForAgency(agencyId);
      for (const a of assignments) {
        const list = assignmentsByUser.get(a.userId) || [];
        list.push({ clientId: a.clientId, clientName: a.clientName });
        assignmentsByUser.set(a.userId, list);
      }
    } catch {
      /* ignore */
    }

    // Resolve agency owner profile
    let ownerProfile = {
      id: agencyId,
      name: "Owner",
      email: "",
      timestamp: null as Date | null,
    };
    try {
      const [ownerRow] = await db
        .select({
          id: Users.id,
          name: Users.name,
          email: Users.email,
          timestamp: Users.timestamp,
        })
        .from(Users)
        .where(eq(Users.id, agencyId))
        .limit(1)
        .execute();
      if (ownerRow) {
        ownerProfile = {
          id: ownerRow.id,
          name: ownerRow.name || "Owner",
          email: ownerRow.email,
          timestamp: ownerRow.timestamp,
        };
      }
    } catch {
      /* ignore */
    }

    const members: Array<{
      id: number;
      membershipId?: number;
      name: string;
      email: string;
      role: string;
      joinedAt: string;
      contentGenerated: number;
      status?: string;
      clients: { clientId: number; clientName: string }[];
    }> = [
      {
        id: ownerProfile.id,
        name: ownerProfile.name,
        email: ownerProfile.email,
        role: "owner",
        joinedAt: ownerProfile.timestamp?.toISOString() || new Date().toISOString(),
        contentGenerated: 0,
        status: "active",
        clients: clients.map((c) => ({ clientId: c.id, clientName: c.name })),
      },
    ];

    try {
      const teamRows = await GetAgencyTeamMembers(agencyId);
      for (const row of teamRows) {
        if (row.userId === agencyId) continue;
        members.push({
          id: row.userId,
          membershipId: row.membershipId,
          name: row.name || row.email || "Member",
          email: row.email,
          role: row.role || "member",
          joinedAt:
            row.joinedAt?.toISOString?.() ||
            row.invitedAt?.toISOString?.() ||
            new Date().toISOString(),
          contentGenerated: 0,
          status: row.status || "active",
          clients: assignmentsByUser.get(row.userId) || [],
        });
      }
    } catch (memberError) {
      console.warn("[Team API] Could not load agency members:", memberError);
    }

    let sentInvitations: Array<{
      id: number;
      email: string;
      role: string;
      status: string;
      clientIds: number[];
      expiresAt?: string;
      createdAt?: string;
    }> = [];

    // Pending invites visible to owners/admins (by agency owner + this admin)
    if (canManageTeam(ctx.role)) {
      try {
        const fromOwner = await GetTeamInvitationsByInviter(agencyId);
        const fromSelf =
          ctx.user.id !== agencyId
            ? await GetTeamInvitationsByInviter(ctx.user.id)
            : [];
        const seen = new Set<number>();
        sentInvitations = [...fromOwner, ...fromSelf]
          .filter((inv) => {
            if (inv.status !== "pending" || seen.has(inv.id)) return false;
            seen.add(inv.id);
            return true;
          })
          .map((inv) => ({
            id: inv.id,
            email: inv.email,
            role: inv.role || "member",
            status: inv.status || "pending",
            clientIds: Array.isArray(inv.clientIds) ? (inv.clientIds as number[]) : [],
            expiresAt: inv.expiresAt?.toISOString?.() || undefined,
            createdAt: inv.createdAt?.toISOString?.() || undefined,
          }));
      } catch (inviteError) {
        console.warn("[Team API] Could not load sent invitations:", inviteError);
      }
    }

    return NextResponse.json({
      members,
      sentInvitations,
      clients,
      access: { role: ctx.role, canManageTeam: canManageTeam(ctx.role) },
    });
  } catch (error) {
    console.error("[Team API] Error fetching team members:", error);
    return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 });
  }
}
