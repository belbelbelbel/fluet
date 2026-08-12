"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Users,
  UserPlus,
  Crown,
  Shield,
  User,
  Mail,
  MoreVertical,
  Trash2,
  Check,
  X,
  Clock,
  Loader2,
  Pencil,
  Briefcase,
  ListTodo,
} from "lucide-react";
import { showToast } from "@/lib/toast";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { TEAM_ROLES, teamRoleLabel } from "@/lib/team-roles";

const TASK_TYPES = [
  { value: "design_image", label: "Design image" },
  { value: "write_caption", label: "Write caption" },
  { value: "review_copy", label: "Review copy" },
  { value: "approve", label: "Approve" },
] as const;

type OpenTask = {
  id: number;
  clientId: number;
  clientName: string;
  type: string;
  status: string;
  description: string | null;
  dueDate: string | null;
  assignedTo: number | null;
};

interface ReceivedInvitation {
  id: number;
  expiresAt?: string;
}

interface SentInvitation {
  id: number;
  email: string;
  role: string;
  status: string;
  clientIds: number[];
  expiresAt?: string;
}

interface AgencyClient {
  id: number;
  name: string;
}

interface TeamMember {
  id: number;
  membershipId?: number;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  contentGenerated: number;
  status?: string;
  clients: { clientId: number; clientName: string }[];
}

export default function TeamPage() {
  const { userId } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [clients, setClients] = useState<AgencyClient[]>([]);
  const [receivedInvitations, setReceivedInvitations] = useState<ReceivedInvitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<SentInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [savingMember, setSavingMember] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteClientIds, setInviteClientIds] = useState<number[]>([]);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [editRole, setEditRole] = useState("member");
  const [editClientIds, setEditClientIds] = useState<number[]>([]);
  const [editOpenTasks, setEditOpenTasks] = useState<OpenTask[]>([]);
  const [loadingEditTasks, setLoadingEditTasks] = useState(false);
  const [assignTaskIds, setAssignTaskIds] = useState<number[]>([]);
  const [newTaskClientId, setNewTaskClientId] = useState<number | "">("");
  const [newTaskType, setNewTaskType] = useState<string>("write_caption");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [removeConfirm, setRemoveConfirm] = useState<{
    open: boolean;
    membershipId: number | null;
    name: string;
  }>({ open: false, membershipId: null, name: "" });

  const fetchInvitations = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await fetch(`/api/team/invitations?userId=${userId}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setReceivedInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error("Error fetching invitations:", error);
    }
  }, [userId]);

  const fetchTeamMembers = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/team?userId=${userId}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
        setSentInvitations(data.sentInvitations || []);
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchTeamMembers();
      fetchInvitations();
    }
  }, [userId, fetchTeamMembers, fetchInvitations]);

  const toggleId = (list: number[], id: number) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      showToast.error("Invalid email", "Please enter a valid email address");
      return;
    }

    setInviting(true);
    try {
      const response = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: inviteEmail.trim(),
          userId,
          role: inviteRole,
          clientIds: inviteClientIds,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        showToast.success(
          data.emailSent ? "Invitation sent" : "Invitation saved",
          data.message || `Invited as ${teamRoleLabel(inviteRole)}`
        );
        setInviteEmail("");
        setInviteRole("member");
        setInviteClientIds([]);
        setShowInviteModal(false);
        fetchTeamMembers();
        fetchInvitations();
      } else {
        showToast.error("Invitation failed", data.error || "Please try again.");
      }
    } catch {
      showToast.error("Error", "Failed to send invitation. Please try again.");
    } finally {
      setInviting(false);
    }
  };

  const openEdit = (member: TeamMember) => {
    setEditMember(member);
    setEditRole(member.role === "owner" ? "admin" : member.role || "member");
    setEditClientIds(member.clients.map((c) => c.clientId));
    setEditOpenTasks([]);
    setAssignTaskIds([]);
    setNewTaskClientId("");
    setNewTaskType("write_caption");
    setNewTaskDescription("");
  };

  const closeEdit = (force = false) => {
    if (savingMember && !force) return;
    setEditMember(null);
    setEditOpenTasks([]);
    setAssignTaskIds([]);
    setNewTaskClientId("");
    setNewTaskDescription("");
  };

  const loadOpenTasksForClients = useCallback(
    async (member: TeamMember, clientIds: number[]) => {
      if (!userId || clientIds.length === 0) {
        setEditOpenTasks([]);
        setAssignTaskIds([]);
        return;
      }
      setLoadingEditTasks(true);
      try {
        const results = await Promise.all(
          clientIds.map(async (clientId) => {
            const res = await fetch(
              `/api/clients/${clientId}/tasks?userId=${userId}`,
              { credentials: "include" }
            );
            if (!res.ok) return [] as OpenTask[];
            const data = await res.json();
            const clientName =
              clients.find((c) => c.id === clientId)?.name ||
              member.clients.find((c) => c.clientId === clientId)?.clientName ||
              `Client #${clientId}`;
            return ((data.tasks || []) as Array<Record<string, unknown>>)
              .filter((t) => (t.status as string) !== "completed")
              .map((t) => ({
                id: t.id as number,
                clientId,
                clientName,
                type: (t.type as string) || "write_caption",
                status: (t.status as string) || "assigned",
                description: (t.description as string) || null,
                dueDate: (t.dueDate as string) || null,
                assignedTo: (t.assignedTo as number) ?? null,
              }));
          })
        );
        const flat = results.flat().sort((a, b) => b.id - a.id);
        setEditOpenTasks(flat);
        setAssignTaskIds(
          flat.filter((t) => t.assignedTo === member.id).map((t) => t.id)
        );
      } catch {
        setEditOpenTasks([]);
      } finally {
        setLoadingEditTasks(false);
      }
    },
    [userId, clients]
  );

  useEffect(() => {
    if (!editMember) return;
    loadOpenTasksForClients(editMember, editClientIds);
  }, [editMember, editClientIds, loadOpenTasksForClients]);

  const handleSaveMember = async () => {
    if (!editMember?.membershipId) return;
    setSavingMember(true);
    try {
      const response = await fetch(`/api/team/${editMember.membershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role: editRole, clientIds: editClientIds }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        showToast.error("Update failed", data.error || "Try again");
        return;
      }

      // Assign / unassign open tasks for this member
      await Promise.all(
        editOpenTasks.map(async (task) => {
          const shouldHave = assignTaskIds.includes(task.id);
          const has = task.assignedTo === editMember.id;
          if (shouldHave === has) return;
          await fetch(`/api/clients/${task.clientId}/tasks/${task.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              userId,
              type: task.type,
              status: task.status,
              description: task.description,
              dueDate: task.dueDate,
              assignedTo: shouldHave ? editMember.id : null,
            }),
          });
        })
      );

      // Optional: create a new task assigned to them
      if (newTaskClientId && newTaskType) {
        if (!editClientIds.includes(Number(newTaskClientId))) {
          showToast.error(
            "Pick a client",
            "Assign them to that client first, then create the task."
          );
          return;
        }
        const createRes = await fetch(
          `/api/clients/${newTaskClientId}/tasks`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              userId,
              type: newTaskType,
              description: newTaskDescription.trim() || undefined,
              assignedTo: editMember.id,
            }),
          }
        );
        if (!createRes.ok) {
          const err = await createRes.json().catch(() => ({}));
          showToast.error(
            "Member updated",
            err.error || "Access saved, but the new task wasn’t created."
          );
          closeEdit(true);
          fetchTeamMembers();
          return;
        }
      }

      showToast.success("Updated", "Access and work assignment saved");
      closeEdit(true);
      fetchTeamMembers();
    } catch {
      showToast.error("Error", "Failed to update member");
    } finally {
      setSavingMember(false);
    }
  };

  const handleRemoveMemberConfirm = async () => {
    if (!removeConfirm.membershipId) return;
    const membershipId = removeConfirm.membershipId;
    setRemoveConfirm({ open: false, membershipId: null, name: "" });

    try {
      const response = await fetch(`/api/team/${membershipId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        showToast.success("Member removed", "They no longer have team access");
        fetchTeamMembers();
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast.error("Failed to remove member", errorData.error || "Try again");
      }
    } catch {
      showToast.error("Error", "Failed to remove team member");
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-amber-500" />;
      case "admin":
      case "manager":
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className={`w-4 h-4 text-muted-foreground`} />;
    }
  };

  const clientNameById = (id: number) =>
    clients.find((c) => c.id === id)?.name || `Client #${id}`;

  const fieldClass = isDark
    ? "bg-slate-700 border-slate-600 text-white"
    : "bg-white border-gray-300 text-gray-950";

  const ClientChecklist = ({
    selected,
    onChange,
  }: {
    selected: number[];
    onChange: (ids: number[]) => void;
  }) => (
    <div className="space-y-2">
      <label
        className={`text-sm font-semibold block text-foreground/80`}
      >
        Assign to clients
      </label>
      {clients.length === 0 ? (
        <p className={`text-sm text-muted-foreground`}>
          No clients yet — add clients first, then assign them here.
        </p>
      ) : (
        <div
          className={`max-h-40 overflow-y-auto rounded-xl border p-2 space-y-1 ${
            isDark ? "border-slate-600" : "border-gray-200"
          }`}
        >
          {clients.map((client) => {
            const checked = selected.includes(client.id);
            return (
              <label
                key={client.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-sm ${
                  isDark ? "hover:bg-slate-700" : "hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onChange(toggleId(selected, client.id))}
                  className="rounded border-gray-300"
                />
                <span className={isDark ? "text-slate-200" : "text-gray-800"}>
                  {client.name}
                </span>
              </label>
            );
          })}
        </div>
      )}
      <p className={`text-xs text-muted-foreground`}>
        They&apos;ll only work on the clients you select.
      </p>
    </div>
  );

  return (
    <div
      className={`space-y-6 sm:space-y-8 pt-4 sm:pt-6 lg:pt-8 pb-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 bg-background`}
    >
      <div
        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border`}
      >
        <div>
          <h1
            className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-2 text-foreground`}
          >
            Team
          </h1>
          <p className={isDark ? "text-slate-400" : "text-gray-600"}>
            Invite people, set roles, assign clients, and hand off work
          </p>
        </div>
        <Button onClick={() => setShowInviteModal(true)} className="w-full sm:w-auto rounded-xl">
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: "People", value: members.length, icon: Users },
          {
            title: "Collaborators",
            value: members.filter((m) => m.role !== "owner").length,
            icon: UserPlus,
          },
          { title: "Pending invites", value: sentInvitations.length, icon: Clock },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className={`border rounded-xl bg-card border-border`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle
                  className={`text-sm font-semibold text-muted-foreground`}
                >
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 text-muted-foreground`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold text-foreground`}>
                  {loading ? "—" : stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card
        className={`border rounded-xl bg-card border-border`}
      >
        <CardHeader>
          <CardTitle className={isDark ? "text-white" : "text-gray-950"}>Team members</CardTitle>
          <CardDescription className={isDark ? "text-slate-400" : "text-gray-600"}>
            Role + client access for each person
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-24 rounded-xl animate-pulse bg-accent`}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={`${member.id}-${member.membershipId || "owner"}`}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border ${
                    isDark
                      ? "bg-slate-700/50 border-slate-700"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                      {(member.name || member.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p
                          className={`font-semibold text-foreground`}
                        >
                          {member.name}
                        </p>
                        {getRoleIcon(member.role)}
                        <Badge variant={member.role === "owner" ? "warning" : "secondary"}>
                          {member.role === "owner" ? "Owner" : teamRoleLabel(member.role)}
                        </Badge>
                      </div>
                      <p
                        className={`text-sm flex items-center gap-1.5 text-muted-foreground`}
                      >
                        <Mail className="w-3 h-3" />
                        {member.email}
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {member.role === "owner" ? (
                          <span
                            className={`text-xs inline-flex items-center gap-1 text-muted-foreground`}
                          >
                            <Briefcase className="w-3 h-3" />
                            All clients
                          </span>
                        ) : member.clients.length === 0 ? (
                          <span
                            className={`text-xs ${
                              isDark ? "text-amber-300/90" : "text-amber-700"
                            }`}
                          >
                            No clients assigned yet
                          </span>
                        ) : (
                          member.clients.map((c) => (
                            <span
                              key={c.clientId}
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                isDark
                                  ? "bg-slate-600 text-slate-200"
                                  : "bg-white border border-gray-200 text-gray-700"
                              }`}
                            >
                              {c.clientName}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  {member.role !== "owner" && member.membershipId != null && (
                    <DropdownMenu
                      trigger={
                        <Button variant="ghost" size="sm" className="rounded-lg shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      }
                    >
                      <DropdownMenuItem
                        onClick={() => openEdit(member)}
                        icon={<Pencil className="w-4 h-4" />}
                      >
                        Edit role & clients
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          setRemoveConfirm({
                            open: true,
                            membershipId: member.membershipId!,
                            name: member.name,
                          })
                        }
                        icon={<Trash2 className="w-4 h-4" />}
                      >
                        Remove member
                      </DropdownMenuItem>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {sentInvitations.length > 0 && (
        <Card
          className={`border rounded-xl bg-card border-border`}
        >
          <CardHeader>
            <CardTitle className={isDark ? "text-white" : "text-gray-950"}>
              Sent invitations
            </CardTitle>
            <CardDescription className={isDark ? "text-slate-400" : "text-gray-600"}>
              Waiting for them to accept
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sentInvitations.map((inv) => (
              <div
                key={inv.id}
                className={`p-4 rounded-xl border ${
                  isDark ? "border-slate-600 bg-slate-700/40" : "border-amber-100 bg-amber-50/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className={`font-medium text-foreground`}>
                      {inv.email}
                    </p>
                    <p className={`text-xs mt-1 text-muted-foreground`}>
                      {teamRoleLabel(inv.role)} · pending
                      {inv.expiresAt
                        ? ` · expires ${new Date(inv.expiresAt).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </div>
                {inv.clientIds?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {inv.clientIds.map((id) => (
                      <span
                        key={id}
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          isDark ? "bg-slate-600 text-slate-200" : "bg-white border text-gray-700"
                        }`}
                      >
                        {clientNameById(id)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {receivedInvitations.length > 0 && (
        <Card
          className={`border rounded-xl bg-card border-border`}
        >
          <CardHeader>
            <CardTitle className={isDark ? "text-white" : "text-gray-950"}>
              Invitations for you
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {receivedInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className={`flex items-center justify-between gap-3 p-4 rounded-xl border ${
                  isDark ? "border-slate-600" : "border-gray-200"
                }`}
              >
                <p className={`text-sm text-foreground/80`}>
                  Team invitation
                  {invitation.expiresAt
                    ? ` · expires ${new Date(invitation.expiresAt).toLocaleDateString()}`
                    : ""}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={async () => {
                      const response = await fetch(
                        `/api/team/invitations/${invitation.id}/accept`,
                        {
                          method: "POST",
                          credentials: "include",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId }),
                        }
                      );
                      if (response.ok) {
                        showToast.success("Joined team", "You're in!");
                        fetchInvitations();
                        fetchTeamMembers();
                      } else {
                        const errorData = await response.json().catch(() => ({}));
                        showToast.error("Failed", errorData.error || "Try again");
                      }
                    }}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await fetch(`/api/team/invitations/${invitation.id}/reject`, {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId }),
                      });
                      fetchInvitations();
                    }}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Invite modal */}
      {showInviteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => !inviting && setShowInviteModal(false)}
        >
          <Card
            className={`w-full max-w-md border rounded-xl max-h-[90vh] overflow-y-auto bg-card border-border`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle className={isDark ? "text-white" : "text-gray-950"}>
                Invite team member
              </CardTitle>
              <CardDescription className={isDark ? "text-slate-400" : "text-gray-600"}>
                Set their role and which clients they can work on
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label
                  className={`text-sm font-semibold mb-2 block text-foreground/80`}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  autoFocus
                  className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus-visible:ring-ring ${fieldClass}`}
                />
              </div>

              <div>
                <label
                  className={`text-sm font-semibold mb-2 block text-foreground/80`}
                >
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus-visible:ring-ring ${fieldClass}`}
                >
                  {TEAM_ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <p className={`text-xs mt-1.5 text-muted-foreground`}>
                  {TEAM_ROLES.find((r) => r.id === inviteRole)?.description}
                </p>
              </div>

              <ClientChecklist selected={inviteClientIds} onChange={setInviteClientIds} />

              <div className="flex gap-2 pt-1">
                <Button onClick={handleInvite} disabled={inviting} className="flex-1 rounded-xl">
                  {inviting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {inviting ? "Sending…" : "Send invitation"}
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  disabled={inviting}
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail("");
                    setInviteClientIds([]);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit member modal */}
      {editMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => closeEdit()}
        >
          <Card
            className={`w-full max-w-lg border rounded-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl bg-card border-border`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="pb-3 border-b border-border/60 shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle
                    className={`text-lg truncate text-foreground`}
                  >
                    {editMember.name}
                  </CardTitle>
                  <CardDescription
                    className={`truncate text-muted-foreground`}
                  >
                    {editMember.email}
                  </CardDescription>
                </div>
                <button
                  type="button"
                  onClick={() => closeEdit()}
                  disabled={savingMember}
                  className={`rounded-lg p-1.5 shrink-0 ${
                    isDark
                      ? "text-slate-400 hover:bg-slate-700 hover:text-white"
                      : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  }`}
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 overflow-y-auto py-5">
              <section className="space-y-2">
                <label
                  className={`text-xs font-semibold uppercase tracking-wide text-muted-foreground`}
                >
                  Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-xl ${fieldClass}`}
                >
                  {TEAM_ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </section>

              <section>
                <ClientChecklist selected={editClientIds} onChange={setEditClientIds} />
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <ListTodo
                    className={`w-4 h-4 text-foreground/80`}
                  />
                  <div>
                    <p
                      className={`text-sm font-semibold text-foreground`}
                    >
                      Assign work
                    </p>
                    <p className={`text-xs text-muted-foreground`}>
                      Give them open tasks, or create one now
                    </p>
                  </div>
                </div>

                {editClientIds.length === 0 ? (
                  <p
                    className={`text-sm rounded-xl border px-3 py-2.5 ${
                      isDark
                        ? "border-slate-600 text-slate-400"
                        : "border-gray-200 text-gray-500"
                    }`}
                  >
                    Select clients above to assign tasks.
                  </p>
                ) : loadingEditTasks ? (
                  <div
                    className={`flex items-center gap-2 text-sm py-3 text-muted-foreground`}
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading tasks…
                  </div>
                ) : (
                  <div
                    className={`max-h-44 overflow-y-auto rounded-xl border divide-y ${
                      isDark
                        ? "border-slate-600 divide-slate-600"
                        : "border-gray-200 divide-gray-100"
                    }`}
                  >
                    {editOpenTasks.length === 0 ? (
                      <p
                        className={`text-sm px-3 py-3 text-muted-foreground`}
                      >
                        No open tasks on these clients yet.
                      </p>
                    ) : (
                      editOpenTasks.map((task) => {
                        const checked = assignTaskIds.includes(task.id);
                        const typeLabel =
                          TASK_TYPES.find((t) => t.value === task.type)?.label ||
                          task.type;
                        return (
                          <label
                            key={task.id}
                            className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                              isDark ? "hover:bg-slate-700/60" : "hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setAssignTaskIds(toggleId(assignTaskIds, task.id))
                              }
                              className="mt-0.5 rounded border-gray-300"
                            />
                            <span className="min-w-0 flex-1">
                              <span
                                className={`block text-sm font-medium ${
                                  isDark ? "text-slate-100" : "text-gray-900"
                                }`}
                              >
                                {typeLabel}
                                {task.description ? (
                                  <span
                                    className={`font-normal text-muted-foreground`}
                                  >
                                    {" · "}
                                    {task.description.length > 48
                                      ? `${task.description.slice(0, 48)}…`
                                      : task.description}
                                  </span>
                                ) : null}
                              </span>
                              <span
                                className={`block text-xs mt-0.5 text-muted-foreground`}
                              >
                                {task.clientName}
                                {task.assignedTo &&
                                task.assignedTo !== editMember.id
                                  ? " · assigned to someone else"
                                  : null}
                              </span>
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                )}

                <div
                  className={`rounded-xl border p-3 space-y-2.5 ${
                    isDark ? "border-slate-600 bg-slate-900/40" : "border-gray-200 bg-gray-50/80"
                  }`}
                >
                  <p
                    className={`text-xs font-semibold uppercase tracking-wide text-muted-foreground`}
                  >
                    New task for them
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={newTaskClientId}
                      onChange={(e) =>
                        setNewTaskClientId(
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                      disabled={editClientIds.length === 0}
                      className={`w-full px-3 py-2 border rounded-xl text-sm ${fieldClass}`}
                    >
                      <option value="">Client</option>
                      {editClientIds.map((id) => (
                        <option key={id} value={id}>
                          {clientNameById(id)}
                        </option>
                      ))}
                    </select>
                    <select
                      value={newTaskType}
                      onChange={(e) => setNewTaskType(e.target.value)}
                      disabled={editClientIds.length === 0}
                      className={`w-full px-3 py-2 border rounded-xl text-sm ${fieldClass}`}
                    >
                      {TASK_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    disabled={editClientIds.length === 0}
                    placeholder="What should they work on?"
                    className={`w-full px-3 py-2 border rounded-xl text-sm ${fieldClass}`}
                  />
                </div>
              </section>

              <div className="flex gap-2 pt-1 sticky bottom-0">
                <Button
                  onClick={handleSaveMember}
                  disabled={savingMember}
                  className="flex-1 rounded-xl"
                >
                  {savingMember ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Save
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  disabled={savingMember}
                  onClick={() => closeEdit()}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={removeConfirm.open}
        onClose={() => setRemoveConfirm({ open: false, membershipId: null, name: "" })}
        onConfirm={handleRemoveMemberConfirm}
        title="Remove team member"
        description={`Remove ${removeConfirm.name || "this member"}? They'll lose access immediately.`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
