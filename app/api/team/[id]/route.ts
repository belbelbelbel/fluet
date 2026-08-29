import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  RemoveAgencyTeamMember,
  UpdateAgencyTeamMemberRole,
  SetClientAssignments,
  GetAgencyTeamMembers,
  GetClientAssignmentsForAgency,
} from "@/utils/db/actions";
import { isTeamRole } from "@/lib/team-roles";
import { resolveAgencyContext, canManageTeam } from "@/lib/team-access";
import { db } from "@/utils/db/dbConfig";
import { Clients } from "@/utils/db/schema";
import { inArray } from "drizzle-orm";
import {
  sendNotificationEmail,
  getEmailAppUrl,
} from "@/lib/email/send-notification";

export const dynamic = "force-dynamic";

async function resolveClerkId() {
  const authResult = await auth();
  let clerkUserId: string | null | undefined = authResult?.userId || null;
  if (!clerkUserId) {
    try {
      const user = await currentUser();
      clerkUserId = user?.id ?? null;
    } catch {
      /* ignore */
    }
  }
  return clerkUserId;
}

/** PATCH /api/team/[id]. Update role and/or client assignments (id = membershipId) */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clerkUserId = await resolveClerkId();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const ctx = await resolveAgencyContext(clerkUserId);
    if (!ctx || !canManageTeam(ctx.role)) {
      return NextResponse.json(
        { error: "Only owners and admins can manage team members" },
        { status: 403 }
      );
    }

    const membershipId = parseInt(params.id, 10);
    if (Number.isNaN(membershipId)) {
      return NextResponse.json({ error: "Invalid member id" }, { status: 400 });
    }

    const body = await req.json();
    const { role, clientIds } = body as { role?: string; clientIds?: number[] };

    const members = await GetAgencyTeamMembers(ctx.agencyId);
    const membership = members.find((m) => m.membershipId === membershipId);
    if (!membership) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (typeof role === "string" && isTeamRole(role)) {
      await UpdateAgencyTeamMemberRole(ctx.agencyId, membershipId, role);
    }

    let assigned: number[] | undefined;
    if (Array.isArray(clientIds)) {
      // Capture the prior set so we only announce genuinely new work.
      // Re-saving an unchanged list shouldn't spam the member.
      const before = await GetClientAssignmentsForAgency(ctx.agencyId);
      const previous = new Set(
        before.filter((a) => a.userId === membership.userId).map((a) => a.clientId)
      );

      assigned = await SetClientAssignments(
        ctx.agencyId,
        membership.userId,
        clientIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))
      );

      const added = assigned.filter((id) => !previous.has(id));

      if (added.length > 0 && membership.email) {
        try {
          const names = await db
            .select({ name: Clients.name })
            .from(Clients)
            .where(inArray(Clients.id, added))
            .execute();

          const emailResult = await sendNotificationEmail({
            type: "clients_assigned",
            recipientEmail: membership.email,
            data: {
              assignedToName: membership.name || membership.email,
              inviterName: ctx.user.name || "Your agency",
              clientNames: names.map((c) => c.name),
              dashboardLink: `${getEmailAppUrl()}/dashboard/clients`,
            },
          });
          if (!emailResult.sent) {
            console.error("[Team PATCH] Assignment email failed:", emailResult.error);
          }
        } catch (emailError) {
          // Assignment already succeeded, email is best effort
          console.error("[Team PATCH] Assignment email error:", emailError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      membershipId,
      role: typeof role === "string" && isTeamRole(role) ? role : membership.role,
      clientIds: assigned,
    });
  } catch (error) {
    console.error("[Team PATCH]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update member" },
      { status: 500 }
    );
  }
}

/** DELETE /api/team/[id]. Soft-remove member */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clerkUserId = await resolveClerkId();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const ctx = await resolveAgencyContext(clerkUserId);
    if (!ctx || !canManageTeam(ctx.role)) {
      return NextResponse.json(
        { error: "Only owners and admins can remove team members" },
        { status: 403 }
      );
    }

    const membershipId = parseInt(params.id, 10);
    if (Number.isNaN(membershipId)) {
      return NextResponse.json({ error: "Invalid member id" }, { status: 400 });
    }

    const removed = await RemoveAgencyTeamMember(ctx.agencyId, membershipId);
    if (!removed) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Team DELETE]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove member" },
      { status: 500 }
    );
  }
}
