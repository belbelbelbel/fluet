"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
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
  const [members, setMembers] = useState<TeamMember[]>([]);
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
    }
  }, [userId]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/team`, {
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
        const data = await response.json();
        showToast.success("Invitation sent", `Invitation sent to ${inviteEmail}`);
        setInviteEmail("");
        setShowInviteModal(false);
        fetchTeamMembers();
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to send invitation. Please try again.";
        showToast.error("Invitation failed", errorMessage);
      }
    } catch (error) {
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
    } catch (error) {
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
    <div className="space-y-8 pt-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 mb-2">Team Management</h1>
          <p className="text-base text-gray-600">
            Manage your team members and their permissions
          </p>
        </div>
        <Button
          onClick={() => setShowInviteModal(true)}
          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 hover:shadow-md text-white rounded-xl transition-all"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="bg-white border-gray-200 hover:border-gray-300 transition-all rounded-xl"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  {stat.title}
                </CardTitle>
                <div className="text-gray-700 bg-gray-100 p-2.5 rounded-xl">
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-950">
                  {loading ? (
                    <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
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
      <Card className="bg-white border-gray-200 rounded-xl">
        <CardHeader>
          <CardTitle className="text-gray-950">Team Members</CardTitle>
          <CardDescription className="text-gray-600">
            Manage roles and permissions for your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-gray-200 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 mb-2 font-semibold">No team members yet</p>
              <p className="text-sm text-gray-600 mb-4">
                Invite team members to collaborate on content creation
              </p>
              <Button
                onClick={() => setShowInviteModal(true)}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 rounded-xl transition-all"
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
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-950">{member.name}</p>
                        {getRoleIcon(member.role)}
                        {getRoleBadge(member.role)}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-3 h-3 text-gray-500" />
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
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
                          className="text-gray-500 hover:text-gray-950 hover:bg-gray-100 border border-transparent hover:border-gray-300 rounded-lg transition-all"
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

      {/* Invite Modal */}
      {showInviteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowInviteModal(false)}
        >
          <Card
            className="w-full max-w-md bg-white border-gray-200 rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle className="text-gray-950">Invite Team Member</CardTitle>
              <CardDescription className="text-gray-600">
                Send an invitation to collaborate on your content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-950 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleInvite}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 hover:shadow-md text-white rounded-xl transition-all"
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
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 rounded-xl transition-all"
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

