"use client";

import { useState, useEffect } from "react";
import { X, Save, Calendar, User, FileText, Loader2, AlertCircle } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamMemberSelector } from "@/components/TeamMemberSelector";
import { showToast } from "@/lib/toast";

interface Task {
  id: number;
  type: string;
  status: string;
  description?: string;
  dueDate?: string;
  assignedTo?: number;
  assignedToName?: string;
  scheduledPostId?: number;
}

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => Promise<void>;
  teamMembers?: Array<{ id: number; name: string; email: string }>;
}

const TASK_TYPES = [
  { value: "design_image", label: "Design Image" },
  { value: "write_caption", label: "Write Caption" },
  { value: "review_copy", label: "Review Copy" },
  { value: "approve", label: "Approve" },
];

const TASK_STATUSES = [
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onSave,
  teamMembers = [],
}: TaskDetailModalProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [formData, setFormData] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (task) {
      setFormData({ ...task });
      setErrors({});
    }
  }, [task]);

  // Show loading state when modal is open and we're syncing task into formData
  if (!isOpen) return null;
  if (task && !formData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <Card className={`w-full max-w-2xl shadow-xl ${isDark ? "border-slate-700 bg-slate-800" : "border-gray-200 bg-white"}`}>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className={`w-10 h-10 animate-spin ${isDark ? "text-purple-400" : "text-purple-600"}`} />
            <span className={`ml-3 ${isDark ? "text-slate-400" : "text-gray-600"}`}>Loading task...</span>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (!task || !formData) return null;

  const handleSave = async () => {
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.type) {
      newErrors.type = "Task type is required";
    }
    if (!formData.status) {
      newErrors.status = "Status is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSaving(true);
      await onSave(formData);
      showToast.success("Task updated", "Your changes have been saved.");
      onClose();
    } catch (error) {
      console.error("Error saving task:", error);
      showToast.error("Failed to save task", "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className={`w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl ${isDark ? "border-slate-700 bg-slate-800" : "border-gray-200 bg-white"}`}>
        <CardHeader className={`border-b flex flex-row items-center justify-between ${isDark ? "border-slate-700 bg-slate-800/80" : "border-gray-200 bg-gray-50"}`}>
          <CardTitle className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Edit Task</CardTitle>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-slate-700" : "hover:bg-gray-100"}`}
          >
            <X className={`w-5 h-5 ${isDark ? "text-slate-400" : "text-gray-500"}`} />
          </button>
        </CardHeader>
        <CardContent className="pt-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Task Type */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                Task Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                  errors.type ? "border-red-300" : isDark ? "border-slate-600 bg-slate-700 text-white" : "border-gray-300 bg-white"
                }`}
              >
                <option value="">Select type</option>
                {TASK_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="text-xs text-red-600 mt-1">{errors.type}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                  errors.status ? "border-red-300" : isDark ? "border-slate-600 bg-slate-700 text-white" : "border-gray-300 bg-white"
                }`}
              >
                {TASK_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="text-xs text-red-600 mt-1">{errors.status}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                Description
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none ${isDark ? "border-slate-600 bg-slate-700 text-white placeholder-slate-500" : "border-gray-300 bg-white"}`}
                placeholder="Add task description..."
              />
            </div>

            {/* Assigned To */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                Assign To
              </label>
              <TeamMemberSelector
                selectedMemberId={formData.assignedTo || null}
                onSelect={(memberId) =>
                  setFormData({
                    ...formData,
                    assignedTo: memberId || undefined,
                  })
                }
                allowUnassign={true}
                members={teamMembers}
              />
            </div>

            {/* Due Date */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                Due Date
              </label>
              <div className="relative">
                <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? "text-slate-500" : "text-gray-400"}`} />
                <input
                  type="datetime-local"
                  value={
                    formData.dueDate
                      ? new Date(formData.dueDate).toISOString().slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                    })
                  }
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${isDark ? "border-slate-600 bg-slate-700 text-white" : "border-gray-300 bg-white"}`}
                />
              </div>
            </div>

            {/* Task Info */}
            {formData.scheduledPostId && (
              <div className={`p-3 border rounded-lg ${isDark ? "bg-blue-900/30 border-blue-800" : "bg-blue-50 border-blue-200"}`}>
                <div className="flex items-start gap-2">
                  <FileText className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                  <div>
                    <p className={`text-sm font-medium ${isDark ? "text-blue-300" : "text-blue-900"}`}>Linked to Scheduled Post</p>
                    <p className={`text-xs mt-1 ${isDark ? "text-blue-400" : "text-blue-700"}`}>
                      Post ID: {formData.scheduledPostId}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <div className={`border-t px-6 py-4 flex items-center justify-end gap-3 ${isDark ? "border-slate-700 bg-slate-800/80" : "border-gray-200 bg-gray-50"}`}>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
