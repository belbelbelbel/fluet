"use client";

import { useState, useEffect } from "react";
import { User, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface TeamMemberSelectorProps {
  selectedMemberId?: number | null;
  onSelect: (memberId: number | null) => void;
  allowUnassign?: boolean;
  className?: string;
}

export function TeamMemberSelector({
  selectedMemberId,
  onSelect,
  allowUnassign = true,
  className,
}: TeamMemberSelectorProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/team", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setMembers(data.members || []);
        }
      } catch (error) {
        console.error("Failed to fetch team members:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Loading team members...</span>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-sm">
            {selectedMember
              ? `${selectedMember.name}${selectedMember.role ? ` (${selectedMember.role})` : ""}`
              : "Assign to team member"}
          </span>
        </div>
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="p-2 max-h-60 overflow-y-auto">
              {allowUnassign && (
                <button
                  onClick={() => {
                    onSelect(null);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    !selectedMemberId
                      ? "bg-purple-50 text-purple-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>Unassigned</span>
                    {!selectedMemberId && (
                      <Check className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                </button>
              )}
              {members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => {
                    onSelect(member.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    selectedMemberId === member.id
                      ? "bg-purple-50 text-purple-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-xs text-gray-500">{member.email}</div>
                      {member.role && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          {member.role}
                        </div>
                      )}
                    </div>
                    {selectedMemberId === member.id && (
                      <Check className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                </button>
              ))}
              {members.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  No team members found
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
