/** Agency team roles for invites + membership */
export const TEAM_ROLES = [
  {
    id: "admin",
    label: "Admin",
    description: "Full access — manage team, clients, and billing-adjacent settings",
  },
  {
    id: "manager",
    label: "Manager",
    description: "Oversee clients, approve work, assign tasks",
  },
  {
    id: "designer",
    label: "Designer",
    description: "Create visuals and design assets for assigned clients",
  },
  {
    id: "copywriter",
    label: "Copywriter",
    description: "Write captions and content for assigned clients",
  },
  {
    id: "member",
    label: "Member",
    description: "General collaborator on assigned clients",
  },
] as const;

export type TeamRoleId = (typeof TEAM_ROLES)[number]["id"];

export function isTeamRole(value: string): value is TeamRoleId {
  return TEAM_ROLES.some((r) => r.id === value);
}

export function teamRoleLabel(role: string): string {
  return TEAM_ROLES.find((r) => r.id === role)?.label || role;
}

/** Capability summary for UI prototypes */
export const ROLE_CAPABILITIES: Record<
  TeamRoleId | "owner",
  { allClients: boolean; manageTeam: boolean; assignTasks: boolean }
> = {
  owner: { allClients: true, manageTeam: true, assignTasks: true },
  admin: { allClients: true, manageTeam: true, assignTasks: true },
  manager: { allClients: true, manageTeam: false, assignTasks: true },
  designer: { allClients: false, manageTeam: false, assignTasks: false },
  copywriter: { allClients: false, manageTeam: false, assignTasks: false },
  member: { allClients: false, manageTeam: false, assignTasks: false },
};
