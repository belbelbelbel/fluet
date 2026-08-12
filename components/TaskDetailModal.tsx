"use client";

import { useState, useEffect } from "react";
import { X, Save, Calendar, FileText, Loader2 } from "lucide-react";
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
  assignedBy?: number;
  assignedToName?: string;
  scheduledPostId?: number;
  createdAt?: string;
  updatedAt?: string;
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
        <Card className={`w-full max-w-2xl shadow-xl border-border bg-card`}>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className={`w-10 h-10 animate-spin ${"text-foreground dark:text-purple-400"}`} />
            <span className={`ml-3 text-muted-foreground`}>Loading task...</span>
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
      <Card className={`w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl border-border bg-card`}>
        <CardHeader className={`border-b flex flex-row items-center justify-between ${"border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800/80"}`}>
          <CardTitle className={`text-xl font-semibold text-foreground`}>Edit Task</CardTitle>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${"hover:bg-gray-100 dark:hover:bg-slate-700"}`}
          >
            <X className={`w-5 h-5 text-muted-foreground`} />
          </button>
        </CardHeader>
        <CardContent className="pt-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Task Type */}
            <div>
              <label className={`block text-sm font-medium mb-2 text-foreground/80`}>
                Task Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus-visible:ring-ring focus-visible:border-ring outline-none ${
                  errors.type ? "border-red-300" : "border-gray-300 bg-white dark:border-slate-600 dark:bg-slate-700 dark:text-white"
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
              <label className={`block text-sm font-medium mb-2 text-foreground/80`}>
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus-visible:ring-ring focus-visible:border-ring outline-none ${
                  errors.status ? "border-red-300" : "border-gray-300 bg-white dark:border-slate-600 dark:bg-slate-700 dark:text-white"
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
              <label className={`block text-sm font-medium mb-2 text-foreground/80`}>
                Description
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus-visible:ring-ring focus-visible:border-ring outline-none resize-none ${"border-gray-300 bg-white dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500"}`}
                placeholder="Add task description..."
              />
            </div>

            {/* Assigned To */}
            <div>
              <label className={`block text-sm font-medium mb-2 text-foreground/80`}>
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
              <label className={`block text-sm font-medium mb-2 text-foreground/80`}>
                Due Date
              </label>
              <div className="relative">
                <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground/70`} />
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
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus-visible:ring-ring focus-visible:border-ring outline-none ${"border-gray-300 bg-white dark:border-slate-600 dark:bg-slate-700 dark:text-white"}`}
                />
              </div>
            </div>

            {/* Task Info */}
            {formData.scheduledPostId && (
              <div className={`p-3 border rounded-lg ${"bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800"}`}>
                <div className="flex items-start gap-2">
                  <FileText className={`w-5 h-5 flex-shrink-0 mt-0.5 ${"text-blue-600 dark:text-blue-400"}`} />
                  <div>
                    <p className={`text-sm font-medium ${"text-blue-900 dark:text-blue-300"}`}>Linked to Scheduled Post</p>
                    <p className={`text-xs mt-1 ${"text-blue-700 dark:text-blue-400"}`}>
                      Post ID: {formData.scheduledPostId}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <div className={`border-t px-6 py-4 flex items-center justify-end gap-3 ${"border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800/80"}`}>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
