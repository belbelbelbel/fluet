import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  GetUserByClerkId,
  GetUserByEmail,
  CreateTeamInvitation,
  GetTeamInvitationsByEmail,
  GetClientsByAgency,
} from "@/utils/db/actions";
import {
  getEmailAppUrl,
  sendNotificationEmail,
} from "@/lib/email/send-notification";
import { isTeamRole, teamRoleLabel } from "@/lib/team-roles";
import { resolveAgencyContext, canManageTeam } from "@/lib/team-access";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, role, clientIds } = body as {
      email?: string;
      userId?: string;
      role?: string;
      clientIds?: number[];
    };

    const authResult = await auth();
    let clerkUserId: string | null | undefined = authResult?.userId || null;

    if (!clerkUserId) {
      try {
        const user = await currentUser();
        clerkUserId = user?.id ?? null;
      } catch (userError) {
        console.warn("currentUser() failed:", userError);
      }
    }

    if (!clerkUserId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const inviter = await GetUserByClerkId(clerkUserId);
    if (!inviter) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const ctx = await resolveAgencyContext(clerkUserId);
    if (!ctx || !canManageTeam(ctx.role)) {
      return NextResponse.json(
        { error: "Only owners and admins can invite team members" },
        { status: 403 }
      );
    }

    const normalizedInviterEmail = inviter.email.toLowerCase().trim();
    const normalizedInviteEmail = email.toLowerCase().trim();

    if (normalizedInviterEmail === normalizedInviteEmail) {
      return NextResponse.json(
        { error: "You cannot invite yourself — you're already the team owner." },
        { status: 400 }
      );
    }

    const inviteRole =
      typeof role === "string" && isTeamRole(role.trim()) ? role.trim() : "member";

    const requestedClientIds = Array.isArray(clientIds)
      ? clientIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))
      : [];

    // Validate clients belong to this agency
    let validClientIds: number[] = [];
    if (requestedClientIds.length > 0) {
      const owned = await GetClientsByAgency(ctx.agencyId);
      const ownedSet = new Set(owned.map((c) => c.id));
      validClientIds = requestedClientIds.filter((id) => ownedSet.has(id));
    }

    const invitedUser = await GetUserByEmail(normalizedInviteEmail);

    const existingInvitations = await GetTeamInvitationsByEmail(normalizedInviteEmail);
    const pendingInvitation = existingInvitations.find(
      (inv) => inv.status === "pending" && inv.invitedBy === inviter.id
    );

    if (pendingInvitation) {
      return NextResponse.json(
        { error: "An invitation has already been sent to this email address" },
        { status: 400 }
      );
    }

    const invitation = await CreateTeamInvitation(
      inviter.id,
      normalizedInviteEmail,
      inviteRole,
      validClientIds
    );

    const appUrl = getEmailAppUrl();
    const inviteLink = `${appUrl}/invite/${invitation.token}`;
    if (appUrl.includes("localhost") || appUrl.includes("127.0.0.1")) {
      console.warn(
        "[Team Invite] Invite link uses localhost — set EMAIL_APP_URL to your production domain."
      );
    }

    const emailResult = await sendNotificationEmail({
      type: "team_invitation",
      recipientEmail: normalizedInviteEmail,
      data: {
        inviterName: inviter.name || inviter.email,
        role: teamRoleLabel(inviteRole),
        inviteLink,
        expiresAt: invitation.expiresAt?.toISOString?.() || String(invitation.expiresAt),
      },
    });

    return NextResponse.json({
      success: true,
      emailSent: emailResult.sent,
      message: emailResult.sent
        ? `Invitation sent as ${teamRoleLabel(inviteRole)}${
            validClientIds.length
              ? ` with ${validClientIds.length} client${validClientIds.length === 1 ? "" : "s"}`
              : ""
          }.`
        : `Invitation saved, but email failed: ${emailResult.error || "unknown error"}`,
      invitation: {
        id: invitation.id,
        email: normalizedInviteEmail,
        invitedUserId: invitedUser?.id ?? null,
        invitedBy: inviter.id,
        status: invitation.status,
        role: inviteRole,
        clientIds: validClientIds,
        token: invitation.token,
        expiresAt: invitation.expiresAt,
        inviteLink,
      },
    });
  } catch (error) {
    console.error("[Team Invite] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to send invitation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
