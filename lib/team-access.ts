import {
  GetUserByClerkId,
  GetClientById,
  GetAssignedClientIds,
  GetActiveTeamMembership,
  GetClientsByAgency,
} from "@/utils/db/actions";
import { isTeamRole, type TeamRoleId } from "@/lib/team-roles";

export type AgencyContext = {
  user: {
    id: number;
    email: string;
    name: string | null;
    userType: string | null;
    agencyId: number | null;
  };
  /** Owning agency user id (owner's Users.id) */
  agencyId: number;
  /** true when this user owns the agency */
  isOwner: boolean;
  role: TeamRoleId | "owner";
};

/** Roles that can see / manage all agency clients */
export function canAccessAllClients(role: AgencyContext["role"]): boolean {
  return role === "owner" || role === "admin" || role === "manager";
}

/** Roles that can manage team (invite/edit members) */
export function canManageTeam(role: AgencyContext["role"]): boolean {
  return role === "owner" || role === "admin";
}

/** Roles that can assign tasks to others */
export function canAssignTasks(role: AgencyContext["role"]): boolean {
  return role === "owner" || role === "admin" || role === "manager";
}

/**
 * Resolve the signed-in user into an agency workspace context.
 * Owners: agencyId = their own id.
 * Team members: agencyId from Users.agencyId or active membership.
 */
export async function resolveAgencyContext(
  clerkUserId: string
): Promise<AgencyContext | null> {
  const user = await GetUserByClerkId(clerkUserId);
  if (!user?.id) return null;

  const membership = await GetActiveTeamMembership(user.id);

  // Owner accounts: userType agency (or unset) with no foreign agencyId.
  // Do NOT let a stale/wrong team membership row hijack their workspace
  // (that was showing 0 clients when clients still lived under user.id).
  const looksLikeAgencyOwner =
    (user.userType === "agency" || !user.userType) &&
    (!user.agencyId || user.agencyId === user.id);

  // Team member of another agency (explicit link on Users.agencyId)
  if (user.agencyId && user.agencyId !== user.id) {
    const roleRaw = membership?.role || "member";
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.userType ?? null,
        agencyId: user.agencyId,
      },
      agencyId: user.agencyId,
      isOwner: false,
      role: isTeamRole(roleRaw) ? roleRaw : "member",
    };
  }

  // Active membership on another agency, only if this user is not an owner workspace
  if (
    membership?.agencyId &&
    membership.agencyId !== user.id &&
    !looksLikeAgencyOwner
  ) {
    const roleRaw = membership.role || "member";
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.userType ?? null,
        agencyId: user.agencyId ?? null,
      },
      agencyId: membership.agencyId,
      isOwner: false,
      role: isTeamRole(roleRaw) ? roleRaw : "member",
    };
  }

  // Membership on own agency (owner row) or default owner workspace
  if (membership?.agencyId === user.id) {
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.userType ?? "agency",
        agencyId: user.agencyId ?? null,
      },
      agencyId: user.id,
      isOwner: true,
      role: "owner",
    };
  }

  // Default: user is their own agency owner
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      userType: user.userType ?? "agency",
      agencyId: user.agencyId ?? null,
    },
    agencyId: user.id,
    isOwner: true,
    role: "owner",
  };
}

/**
 * Load clients visible to this user (all for owner/admin/manager, assigned only otherwise).
 */
export async function getAccessibleClients(ctx: AgencyContext) {
  const all = await GetClientsByAgency(ctx.agencyId);
  if (canAccessAllClients(ctx.role)) return all;
  const assignedIds = await GetAssignedClientIds(ctx.user.id, ctx.agencyId);
  const set = new Set(assignedIds);
  return all.filter((c) => set.has(c.id));
}

/**
 * Assert the user can access a client. Returns the client row or null.
 */
export async function assertClientAccess(
  ctx: AgencyContext,
  clientId: number
): Promise<Awaited<ReturnType<typeof GetClientById>> | null> {
  const client = await GetClientById(clientId, ctx.agencyId);
  if (!client) return null;

  if (canAccessAllClients(ctx.role)) return client;

  const assignedIds = await GetAssignedClientIds(ctx.user.id, ctx.agencyId);
  if (!assignedIds.includes(clientId)) return null;
  return client;
}

/**
 * Resolve auth + client access in one step for API routes.
 * Pass clientId when the request is scoped to a client; omit for agency-only actions.
 */
export async function requireClientAccess(
  clerkUserId: string,
  clientId: number
): Promise<
  | { ok: true; ctx: AgencyContext; client: NonNullable<Awaited<ReturnType<typeof GetClientById>>> }
  | { ok: false; status: 404; error: string }
> {
  const ctx = await resolveAgencyContext(clerkUserId);
  if (!ctx) {
    return { ok: false, status: 404, error: "User not found" };
  }
  const client = await assertClientAccess(ctx, clientId);
  if (!client) {
    return { ok: false, status: 404, error: "Client not found or access denied" };
  }
  return { ok: true, ctx, client };
}
