import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/utils/db/dbConfig";
import { TeamInvitations, AgencyTeamMembers, Users } from "@/utils/db/schema";
import { eq, and } from "drizzle-orm";
import {
  GetUserByClerkId,
  GetTeamInvitationByToken,
  SetClientAssignments,
} from "@/utils/db/actions";

export const dynamic = "force-dynamic";

/** GET — preview invite (public enough for signed-in users; no secrets beyond email) */
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const invitation = await GetTeamInvitationByToken(params.token);
    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    const [inviter] = await db
      .select({ name: Users.name, email: Users.email })
      .from(Users)
      .where(eq(Users.id, invitation.invitedBy))
      .limit(1)
      .execute();

    const expired =
      invitation.status === "expired" ||
      (!!invitation.expiresAt && new Date(invitation.expiresAt) < new Date());

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role || "member",
        status: expired && invitation.status === "pending" ? "expired" : invitation.status,
        expiresAt: invitation.expiresAt,
        inviterName: inviter?.name || inviter?.email || "A Revvy teammate",
      },
    });
  } catch (error) {
    console.error("[Invite by token GET]", error);
    return NextResponse.json({ error: "Failed to load invitation" }, { status: 500 });
  }
}

/** POST — accept invite by token (must be signed in as the invited email) */
export async function POST(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
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

    if (!clerkUserId) {
      return NextResponse.json({ error: "Sign in to accept this invitation" }, { status: 401 });
    }

    const user = await GetUserByClerkId(clerkUserId);
    if (!user) {
      return NextResponse.json(
        { error: "Complete account setup first, then reopen this invite link." },
        { status: 404 }
      );
    }

    const invitation = await GetTeamInvitationByToken(params.token);
    if (!invitation || invitation.status !== "pending") {
      return NextResponse.json(
        { error: "Invitation not found or already used" },
        { status: 404 }
      );
    }

    if (invitation.email.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
      return NextResponse.json(
        {
          error: `This invite was sent to ${invitation.email}. Sign in with that email to accept.`,
        },
        { status: 403 }
      );
    }

    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
      await db
        .update(TeamInvitations)
        .set({ status: "expired" })
        .where(eq(TeamInvitations.id, invitation.id))
        .execute();
      return NextResponse.json({ error: "This invitation has expired" }, { status: 400 });
    }

    const [existingMember] = await db
      .select()
      .from(AgencyTeamMembers)
      .where(
        and(
          eq(AgencyTeamMembers.userId, user.id),
          eq(AgencyTeamMembers.agencyId, invitation.invitedBy)
        )
      )
      .limit(1)
      .execute();

    if (!existingMember) {
      await db
        .insert(AgencyTeamMembers)
        .values({
          userId: user.id,
          agencyId: invitation.invitedBy,
          role: invitation.role || "member",
          invitedBy: invitation.invitedBy,
          status: "active",
          joinedAt: new Date(),
        })
        .execute();
    } else {
      await db
        .update(AgencyTeamMembers)
        .set({
          status: "active",
          joinedAt: new Date(),
          role: invitation.role || "member",
        })
        .where(
          and(
            eq(AgencyTeamMembers.userId, user.id),
            eq(AgencyTeamMembers.agencyId, invitation.invitedBy)
          )
        )
        .execute();
    }

    await db
      .update(TeamInvitations)
      .set({ status: "accepted", acceptedAt: new Date() })
      .where(eq(TeamInvitations.id, invitation.id))
      .execute();

    // Assign clients from the invite
    const inviteClientIds = Array.isArray(invitation.clientIds)
      ? (invitation.clientIds as number[])
      : [];
    if (inviteClientIds.length > 0) {
      try {
        await SetClientAssignments(invitation.invitedBy, user.id, inviteClientIds);
      } catch (assignErr) {
        console.warn("[Invite by token] Client assign failed:", assignErr);
      }
    }

    // Link team member to agency on user record when supported
    try {
      await db
        .update(Users)
        .set({ agencyId: invitation.invitedBy, userType: "team_member" })
        .where(eq(Users.id, user.id))
        .execute();
    } catch {
      /* optional columns / constraints — ignore */
    }

    return NextResponse.json({
      success: true,
      message: "You've joined the team",
      redirectTo: "/dashboard/team",
    });
  } catch (error) {
    console.error("[Invite by token POST]", error);
    return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 });
  }
}
