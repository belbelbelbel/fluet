"use client";

import { useState, useEffect } from "react";
import { X, Save, Calendar, User, FileText, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamMemberSelector } from "@/components/TeamMemberSelector";

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
  const [formData, setFormData] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (task) {
      setFormData({ ...task });
      setErrors({});
    }
  }, [task]);

  if (!isOpen || !task || !formData) return null;

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
      onClose();
    } catch (error) {
      console.error("Error saving task:", error);
      alert("Failed to save task. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden border-gray-200 shadow-xl">
        <CardHeader className="border-b border-gray-200 bg-gray-50 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-900">Edit Task</CardTitle>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </CardHeader>
        <CardContent className="pt-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Task Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                  errors.type ? "border-red-300" : "border-gray-300"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                  errors.status ? "border-red-300" : "border-gray-300"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
                placeholder="Add task description..."
              />
            </div>

            {/* Assigned To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                />
              </div>
            </div>

            {/* Task Info */}
            {formData.scheduledPostId && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Linked to Scheduled Post</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Post ID: {formData.scheduledPostId}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
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
