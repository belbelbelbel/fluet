"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskDetailModal } from "@/components/TaskDetailModal";
import { showToast } from "@/lib/toast";
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  Clock,
  User,
  Loader2,
  Filter,
  Edit,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: number;
  type: string;
  status: string;
  description?: string;
  dueDate?: string;
  assignedTo?: number;
  assignedBy?: number;
  assignedToName?: string;
  createdAt: string;
}

/** Normalize API task (camelCase or snake_case) to Task shape */
function normalizeTask(row: Record<string, unknown>): Task {
  const due = row.dueDate ?? row.due_date;
  const assignedToVal = row.assignedTo ?? row.assigned_to;
  const assignedByVal = row.assignedBy ?? row.assigned_by;
  const assignedToNameVal = row.assignedToName ?? row.assigned_to_name;
  const createdAtVal = row.createdAt ?? row.created_at;
  return {
    id: Number(row.id),
    type: String(row.type ?? ""),
    status: String(row.status ?? "assigned"),
    description: row.description != null ? String(row.description) : undefined,
    dueDate: due != null ? String(due) : undefined,
    assignedTo: assignedToVal != null ? Number(assignedToVal) : undefined,
    assignedBy: assignedByVal != null ? Number(assignedByVal) : undefined,
    assignedToName: assignedToNameVal != null ? String(assignedToNameVal) : undefined,
    createdAt: createdAtVal != null ? String(createdAtVal) : "",
  };
}

export default function TasksPage() {
  const params = useParams();
  const router = useRouter();
  const { userId } = useAuth();
  const clientId = params?.clientId ? parseInt(params.clientId as string) : null;

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<"all" | "assigned" | "in_progress" | "completed">("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: number; name: string; email: string }>>([]);

  const fetchTasks = useCallback(async () => {
    if (!clientId) return;
    try {
      setLoading(true);
      const url = userId ? `/api/clients/${clientId}/tasks?userId=${encodeURIComponent(userId)}` : `/api/clients/${clientId}/tasks`;
      const response = await fetch(url, {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && Array.isArray(data.tasks)) {
        setTasks(data.tasks.map((t: Record<string, unknown>) => normalizeTask(t)));
      } else {
        setTasks([]);
        if (!response.ok) {
          showToast.error("Could not load tasks", data?.error || "Please try again.");
        }
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      setTasks([]);
      showToast.error("Could not load tasks", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [clientId, userId]);

  useEffect(() => {
    if (!clientId) return;

    const fetchTeamMembers = async () => {
      try {
        const teamUrl = userId ? `/api/team?userId=${encodeURIComponent(userId)}` : "/api/team";
        const response = await fetch(teamUrl, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setTeamMembers(data.members || []);
        }
      } catch (error) {
        console.error("Failed to fetch team members:", error);
      }
    };

    fetchTasks();
    fetchTeamMembers();
  }, [clientId, fetchTasks]);

  // Refetch when page becomes visible (e.g. returning from Create Task)
  useEffect(() => {
    if (!clientId) return;
    const onFocus = () => fetchTasks();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [clientId, fetchTasks]);

  const handleTaskSave = async (updatedTask: Task) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/tasks/${updatedTask.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ ...updatedTask, ...(userId && { userId }) }),
      });

      if (response.ok) {
        // Refresh tasks list
        const refreshUrl = userId ? `/api/clients/${clientId}/tasks?userId=${encodeURIComponent(userId)}` : `/api/clients/${clientId}/tasks`;
        const tasksResponse = await fetch(refreshUrl, {
          credentials: "include",
        });
        if (tasksResponse.ok) {
          const data = await tasksResponse.json();
          setTasks(Array.isArray(data.tasks) ? data.tasks.map((t: Record<string, unknown>) => normalizeTask(t)) : []);
        }
      } else {
        throw new Error("Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    if (filter === "assigned") return task.status === "assigned";
    if (filter === "in_progress") return task.status === "in_progress";
    if (filter === "completed") return task.status === "completed";
    return true;
  });

  const getTaskTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      design_image: "Design Image",
      write_caption: "Write Caption",
      review_copy: "Review Copy",
      approve: "Approve",
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "assigned":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        </div>
        <Button
          onClick={() => router.push(`/dashboard/clients/${clientId}/tasks/new`)}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <Filter className="w-4 h-4 text-gray-400" />
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
            filter === "all"
              ? "bg-purple-100 text-purple-700"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          )}
        >
          All ({tasks.length})
        </button>
        <button
          onClick={() => setFilter("assigned")}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
            filter === "assigned"
              ? "bg-purple-100 text-purple-700"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          )}
        >
          Assigned ({tasks.filter((t) => t.status === "assigned").length})
        </button>
        <button
          onClick={() => setFilter("in_progress")}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
            filter === "in_progress"
              ? "bg-purple-100 text-purple-700"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          )}
        >
          In Progress ({tasks.filter((t) => t.status === "in_progress").length})
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
            filter === "completed"
              ? "bg-purple-100 text-purple-700"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          )}
        >
          Completed ({tasks.filter((t) => t.status === "completed").length})
        </button>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <Card className="border-gray-200">
          <CardContent className="pt-12 pb-12 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tasks found
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === "all"
                ? "Create your first task to get started"
                : `No tasks with status "${filter}"`}
            </p>
            {filter === "all" && (
              <Button
                onClick={() => router.push(`/dashboard/clients/${clientId}/tasks/new`)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Task
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTasks.map((task) => (
            <Card
              key={task.id}
              className="border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                        {getTaskTypeLabel(task.type)}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-1 rounded text-xs font-medium border",
                          getStatusColor(task.status)
                        )}
                      >
                        {task.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-700 mb-3">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {task.assignedToName && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{task.assignedToName}</span>
                        </div>
                      )}
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTaskClick(task)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </Button>
                    {task.status === "completed" && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        onSave={handleTaskSave}
        teamMembers={teamMembers}
      />
    </div>
  );
}
