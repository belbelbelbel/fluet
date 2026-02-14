"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
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
  Edit,
  Check,
  X,
} from "lucide-react";
import { showToast } from "@/lib/toast";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
  avatar?: string;
  joinedAt: string;
  contentGenerated: number;
}

export default function TeamPage() {
  const { userId } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [removeConfirm, setRemoveConfirm] = useState<{ open: boolean; id: number | null }>({
    open: false,
    id: null,
  });

  useEffect(() => {
    if (userId) {
      fetchTeamMembers();
      fetchInvitations();
    }
  }, [userId]);

  const fetchInvitations = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`/api/team/invitations?userId=${userId}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error("Error fetching invitations:", error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/team?userId=${userId}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Always ensure we have at least the current user as owner
        if (data.members && data.members.length > 0) {
          setMembers(data.members);
        } else {
          // If no members returned, the current user should still be shown
          // This will be handled by the API, but as a fallback:
          setMembers([]);
        }
      } else {
        console.error("Failed to fetch team members:", response.status);
        // Don't clear members on error, keep what we have
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
      // Don't clear members on error, keep what we have
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      showToast.error("Invalid email", "Please enter a valid email address");
      return;
    }

    try {
      const response = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, userId }),
      });

      if (response.ok) {
        await response.json();
        showToast.success("Invitation sent", `Invitation sent to ${inviteEmail}`);
        setInviteEmail("");
        setShowInviteModal(false);
        fetchTeamMembers();
        fetchInvitations(); // Refresh invitations list
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to send invitation. Please try again.";
        showToast.error("Invitation failed", errorMessage);
      }
    } catch {
      showToast.error("Error", "Failed to send invitation. Please try again.");
    }
  };

  const handleRemoveMemberClick = (memberId: number) => {
    setRemoveConfirm({ open: true, id: memberId });
  };

  const handleRemoveMemberConfirm = async () => {
    if (!removeConfirm.id) return;

    const memberId = removeConfirm.id;
    setRemoveConfirm({ open: false, id: null });

    try {
      const response = await fetch(`/api/team/${memberId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        showToast.success("Member removed", "Team member has been removed");
        fetchTeamMembers();
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to remove member";
        showToast.error("Failed to remove member", errorMessage);
      }
    } catch {
      showToast.error("Error", "Failed to remove team member");
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-yellow-400" />;
      case "admin":
        return <Shield className="w-4 h-4 text-blue-400" />;
      default:
        return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return <Badge variant="warning">Owner</Badge>;
      case "admin":
        return <Badge variant="default">Admin</Badge>;
      default:
        return <Badge variant="secondary">Member</Badge>;
    }
  };

  const stats = [
    {
      title: "Team Members",
      value: members.length,
      icon: Users,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Admins",
      value: members.filter((m) => m.role === "admin" || m.role === "owner").length,
      icon: Shield,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Total Content",
      value: members.reduce((sum, m) => sum + m.contentGenerated, 0),
      icon: User,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
  ];

  return (
    <div className={`space-y-6 sm:space-y-8 pt-4 sm:pt-6 lg:pt-8 pb-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      isDark ? "bg-slate-900" : "bg-white"
    }`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b transition-colors duration-300 ${
        isDark ? "border-slate-700" : "border-gray-200"
      }`}>
        <div>
          <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-2 ${
            isDark ? "text-white" : "text-gray-950"
          }`}>Team Management</h1>
          <p className={isDark ? "text-slate-400" : "text-gray-600"}>
            Manage your team members and their permissions
          </p>
        </div>
        <Button
          onClick={() => setShowInviteModal(true)}
          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 active:bg-purple-800 hover:shadow-md text-white rounded-xl transition-all duration-200 shadow-sm"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className={`border hover:border-opacity-80 transition-all rounded-xl duration-300 ${
                isDark
                  ? "bg-slate-800 border-slate-700 hover:border-slate-600"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className={`text-sm font-semibold uppercase tracking-wide ${
                  isDark ? "text-slate-300" : "text-gray-600"
                }`}>
                  {stat.title}
                </CardTitle>
                <div className={`p-2.5 rounded-xl ${
                  isDark ? "text-slate-300 bg-slate-700" : "text-gray-700 bg-gray-100"
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  isDark ? "text-white" : "text-gray-950"
                }`}>
                  {loading ? (
                    <div className={`h-9 w-20 rounded animate-pulse ${
                      isDark ? "bg-slate-700" : "bg-gray-200"
                    }`} />
                  ) : (
                    stat.value
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Team Members List */}
      <Card className={`border rounded-xl transition-colors duration-300 ${
        isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
      }`}>
        <CardHeader>
          <CardTitle className={isDark ? "text-white" : "text-gray-950"}>Team Members</CardTitle>
          <CardDescription className={isDark ? "text-slate-400" : "text-gray-600"}>
            Manage roles and permissions for your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-20 rounded-xl animate-pulse ${
                    isDark ? "bg-slate-700" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12">
              <Users className={`w-12 h-12 mx-auto mb-4 ${
                isDark ? "text-slate-500" : "text-gray-400"
              }`} />
              <p className={`mb-2 font-semibold ${
                isDark ? "text-white" : "text-gray-700"
              }`}>No team members yet</p>
              <p className={`text-sm mb-4 ${
                isDark ? "text-slate-400" : "text-gray-600"
              }`}>
                Invite team members to collaborate on content creation
              </p>
              <Button
                onClick={() => setShowInviteModal(true)}
                variant="outline"
                className={`rounded-xl transition-all duration-200 ${
                  isDark
                    ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-900"
                }`}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Your First Member
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                    isDark
                      ? "bg-slate-700/50 border-slate-700 hover:border-slate-600"
                      : "bg-gray-50 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold ${
                          isDark ? "text-white" : "text-gray-950"
                        }`}>{member.name}</p>
                        {getRoleIcon(member.role)}
                        {getRoleBadge(member.role)}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className={`w-3 h-3 ${
                          isDark ? "text-slate-400" : "text-gray-500"
                        }`} />
                        <p className={`text-sm ${
                          isDark ? "text-slate-300" : "text-gray-600"
                        }`}>{member.email}</p>
                      </div>
                      <p className={`text-xs mt-1 ${
                        isDark ? "text-slate-400" : "text-gray-500"
                      }`}>
                        {member.contentGenerated} posts • Joined{" "}
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {member.role !== "owner" && (
                    <DropdownMenu
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`border border-transparent rounded-lg transition-all duration-200 ${
                            isDark
                              ? "text-slate-400 hover:text-white hover:bg-slate-700 hover:border-slate-600"
                              : "text-gray-500 hover:text-gray-950 hover:bg-gray-100 hover:border-gray-300"
                          }`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      }
                    >
                      <DropdownMenuItem
                        onClick={() => {}}
                        icon={<Edit className="w-4 h-4" />}
                      >
                        Edit Role
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRemoveMemberClick(member.id)}
                        icon={<Trash2 className="w-4 h-4" />}
                      >
                        Remove Member
                      </DropdownMenuItem>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card className={`border rounded-xl transition-colors duration-300 ${
          isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
        }`}>
          <CardHeader>
            <CardTitle className={isDark ? "text-white" : "text-gray-950"}>Pending Invitations</CardTitle>
            <CardDescription className={isDark ? "text-slate-400" : "text-gray-600"}>
              You have {invitations.length} pending invitation{invitations.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                    isDark
                      ? "bg-slate-700/50 border-slate-600 hover:border-slate-500"
                      : "bg-gray-50 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isDark ? "bg-purple-500/20 text-purple-300" : "bg-purple-100 text-purple-600"
                      }`}>
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={`font-semibold ${
                          isDark ? "text-white" : "text-gray-950"
                        }`}>
                          Team Invitation
                        </p>
                        <p className={`text-sm ${
                          isDark ? "text-slate-400" : "text-gray-600"
                        }`}>
                          You've been invited to join a team
                        </p>
                        <p className={`text-xs mt-1 ${
                          isDark ? "text-slate-500" : "text-gray-500"
                        }`}>
                          Expires {invitation.expiresAt ? new Date(invitation.expiresAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/team/invitations/${invitation.id}/accept`, {
                            method: "POST",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId }),
                          });
                          
                          if (response.ok) {
                            showToast.success("Invitation accepted", "You've joined the team!");
                            fetchInvitations();
                            fetchTeamMembers();
                          } else {
                            const errorData = await response.json().catch(() => ({}));
                            showToast.error("Failed to accept", errorData.error || "Please try again");
                          }
                        } catch (error) {
                          showToast.error("Error", "Failed to accept invitation");
                        }
                      }}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className={isDark ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "border-gray-300 text-gray-700 hover:bg-gray-100"}
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/team/invitations/${invitation.id}/reject`, {
                            method: "POST",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId }),
                          });
                          
                          if (response.ok) {
                            showToast.success("Invitation declined", "Invitation has been declined");
                            fetchInvitations();
                          } else {
                            const errorData = await response.json().catch(() => ({}));
                            showToast.error("Failed to decline", errorData.error || "Please try again");
                          }
                        } catch (error) {
                          showToast.error("Error", "Failed to decline invitation");
                        }
                      }}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowInviteModal(false)}
        >
          <Card
            className={`w-full max-w-md border rounded-xl transition-colors duration-300 ${
              isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle className={isDark ? "text-white" : "text-gray-950"}>Invite Team Member</CardTitle>
              <CardDescription className={isDark ? "text-slate-400" : "text-gray-600"}>
                Send an invitation to collaborate on your content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className={`text-sm font-semibold mb-2 block ${
                  isDark ? "text-slate-300" : "text-gray-700"
                }`}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className={`w-full px-4 py-2 border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    isDark
                      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400 hover:border-slate-500"
                      : "bg-white border-gray-300 text-gray-950 placeholder-gray-400 hover:border-gray-400"
                  }`}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleInvite}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 hover:shadow-md text-white rounded-xl transition-all duration-200"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Send Invitation
                </Button>
                <Button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail("");
                  }}
                  variant="outline"
                  className={`rounded-xl transition-all duration-200 ${
                    isDark
                      ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-900"
                  }`}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {removeConfirm.open && (
        <div className="fixed inset-0 z-[100]">
          <ConfirmDialog
            open={removeConfirm.open}
            onClose={() => setRemoveConfirm({ open: false, id: null })}
            onConfirm={handleRemoveMemberConfirm}
            title="Remove Team Member"
            description="Are you sure you want to remove this team member? They will lose access to the team immediately."
            confirmText="Remove"
            cancelText="Cancel"
            variant="destructive"
          />
        </div>
      )}
    </div>
  );
}

