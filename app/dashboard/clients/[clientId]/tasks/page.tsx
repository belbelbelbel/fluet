"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskDetailModal } from "@/components/TaskDetailModal";
import { showToast } from "@/lib/toast";
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  Clock,
  User,
  Filter,
  Edit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingScreen } from "@/components/LoadingScreen";

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
  updatedAt?: string;
}

/** Normalize API task (camelCase or snake_case) to Task shape */
function normalizeTask(row: Record<string, unknown>): Task {
  const due = row.dueDate ?? row.due_date;
  const assignedToVal = row.assignedTo ?? row.assigned_to;
  const assignedByVal = row.assignedBy ?? row.assigned_by;
  const assignedToNameVal = row.assignedToName ?? row.assigned_to_name;
  const createdAtVal = row.createdAt ?? row.created_at;
  const updatedAtVal = row.updatedAt ?? row.updated_at;
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
    updatedAt: updatedAtVal != null ? String(updatedAtVal) : undefined,
  };
}

/** Calendar-day only: same YYYY-MM-DD in local time */
function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** e.g. "Overdue (2 days ago)", "Due in 3 days", "Due: Jan 15", "No due date", "Completed Jan 10" */
function getDueOrCompletedLabel(task: Task): { text: string; isOverdue: boolean; isCompleted: boolean } {
  const isCompleted = task.status === "completed";
  if (isCompleted && task.updatedAt) {
    const d = new Date(task.updatedAt);
    return { text: `Completed ${d.toLocaleDateString()}`, isOverdue: false, isCompleted: true };
  }
  if (!task.dueDate) {
    return { text: "No due date", isOverdue: false, isCompleted: false };
  }
  const dueDate = new Date(task.dueDate);
  const today = new Date();
  const dueKey = toLocalDateKey(dueDate);
  const todayKey = toLocalDateKey(today);
  // Overdue only when the due *day* has passed (not time-of-day), so "due today" never shows overdue
  const dueTime = dueDate.getTime();
  const now = today.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  const daysFromNow = Math.round((dueTime - now) / oneDay);
  const isOverdue = dueKey < todayKey;
  if (isOverdue) {
    const dueOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const absDays = Math.round((todayOnly - dueOnly) / oneDay);
    return { text: `Overdue (${absDays} day${absDays !== 1 ? "s" : ""} ago)`, isOverdue: true, isCompleted: false };
  }
  if (dueKey === todayKey) return { text: "Due today", isOverdue: false, isCompleted: false };
  if (daysFromNow === 1) return { text: "Due tomorrow", isOverdue: false, isCompleted: false };
  if (daysFromNow > 0 && daysFromNow <= 7) return { text: `Due in ${daysFromNow} days`, isOverdue: false, isCompleted: false };
  if (daysFromNow > 7) return { text: `Due: ${dueDate.toLocaleDateString()}`, isOverdue: false, isCompleted: false };
  return { text: `Due: ${dueDate.toLocaleDateString()}`, isOverdue: false, isCompleted: false };
}

export default function TasksPage() {
  const params = useParams();
  const router = useRouter();
  const { userId } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
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

  type TaskSavePayload = Pick<Task, "id" | "type" | "status"> &
    Partial<Omit<Task, "id" | "type" | "status">>;

  const handleTaskSave = async (updatedTask: TaskSavePayload) => {
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

  const filteredTasks = tasks
    .filter((task) => {
      if (filter === "all") return true;
      if (filter === "assigned") return task.status === "assigned";
      if (filter === "in_progress") return task.status === "in_progress";
      if (filter === "completed") return task.status === "completed";
      return true;
    })
    .sort((a, b) => {
      // Overdue (incomplete + due *day* has passed) first, then by due date (soonest), then completed by completed date
      const todayKey = toLocalDateKey(new Date());
      const aCompleted = a.status === "completed";
      const bCompleted = b.status === "completed";
      const aDueKey = a.dueDate ? toLocalDateKey(new Date(a.dueDate)) : "";
      const bDueKey = b.dueDate ? toLocalDateKey(new Date(b.dueDate)) : "";
      const aOverdue = !aCompleted && a.dueDate && aDueKey < todayKey;
      const bOverdue = !bCompleted && b.dueDate && bDueKey < todayKey;
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;
      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      if (aDue !== bDue) return aDue - bDue;
      const aTime = new Date((aCompleted ? a.updatedAt : a.createdAt) || a.createdAt).getTime();
      const bTime = new Date((bCompleted ? b.updatedAt : b.createdAt) || b.createdAt).getTime();
      return bTime - aTime;
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
        return isDark
          ? "bg-green-950/50 text-green-300 border-green-800"
          : "bg-green-100 text-green-700 border-green-200";
      case "in_progress":
        return isDark
          ? "bg-blue-950/50 text-blue-300 border-blue-800"
          : "bg-blue-100 text-blue-700 border-blue-200";
      case "assigned":
        return isDark
          ? "bg-yellow-950/50 text-yellow-300 border-yellow-800"
          : "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return isDark
          ? "bg-slate-800 text-slate-300 border-slate-700"
          : "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const filterTabClass = (active: boolean) =>
    cn(
      "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
      active
        ? isDark
          ? "bg-slate-700 text-white"
          : "bg-slate-900 text-white"
        : isDark
          ? "text-slate-400 hover:text-white hover:bg-slate-800"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
    );

  if (loading) {
    return <LoadingScreen variant="inline" message="Loading tasks..." />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className={cn("p-2", isDark && "text-slate-300 hover:text-white hover:bg-slate-800")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
            Tasks
          </h1>
        </div>
        <Button
          onClick={() => router.push(`/dashboard/clients/${clientId}/tasks/new`)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* Filter Tabs */}
      <div
        className={cn(
          "flex items-center gap-2 border-b pb-2",
          isDark ? "border-slate-700" : "border-gray-200"
        )}
      >
        <Filter className={cn("w-4 h-4", isDark ? "text-slate-500" : "text-gray-400")} />
        <button onClick={() => setFilter("all")} className={filterTabClass(filter === "all")}>
          All ({tasks.length})
        </button>
        <button
          onClick={() => setFilter("assigned")}
          className={filterTabClass(filter === "assigned")}
        >
          Assigned ({tasks.filter((t) => t.status === "assigned").length})
        </button>
        <button
          onClick={() => setFilter("in_progress")}
          className={filterTabClass(filter === "in_progress")}
        >
          In Progress ({tasks.filter((t) => t.status === "in_progress").length})
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={filterTabClass(filter === "completed")}
        >
          Completed ({tasks.filter((t) => t.status === "completed").length})
        </button>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <Card className={isDark ? "border-slate-700 bg-slate-800" : "border-gray-200"}>
          <CardContent className="pt-12 pb-12 text-center">
            <Clock
              className={cn(
                "w-12 h-12 mx-auto mb-4",
                isDark ? "text-slate-600" : "text-gray-300"
              )}
            />
            <h3
              className={cn(
                "text-lg font-semibold mb-2",
                isDark ? "text-white" : "text-gray-900"
              )}
            >
              No tasks found
            </h3>
            <p className={cn("mb-6", isDark ? "text-slate-400" : "text-gray-600")}>
              {filter === "all"
                ? "Create and assign tasks from the Create Task page to see them here."
                : `No tasks with status "${filter.replace("_", " ")}" yet.`}
            </p>
            {filter === "all" && (
              <Button
                onClick={() => router.push(`/dashboard/clients/${clientId}/tasks/new`)}
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
              className={cn(
                "shadow-sm hover:shadow-md transition-shadow",
                isDark ? "border-slate-700 bg-slate-800" : "border-gray-200"
              )}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span
                        className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          isDark
                            ? "bg-slate-700 text-slate-200"
                            : "bg-muted text-foreground"
                        )}
                      >
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
                      {getDueOrCompletedLabel(task).isOverdue && (
                        <span
                          className={cn(
                            "px-2 py-1 rounded text-xs font-medium border",
                            isDark
                              ? "bg-red-950/50 text-red-300 border-red-800"
                              : "bg-red-50 text-red-700 border-red-200"
                          )}
                        >
                          OVERDUE
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p
                        className={cn(
                          "text-sm mb-3",
                          isDark ? "text-slate-300" : "text-gray-700"
                        )}
                      >
                        {task.description}
                      </p>
                    )}
                    <div
                      className={cn(
                        "flex items-center gap-4 text-xs",
                        isDark ? "text-slate-400" : "text-gray-500"
                      )}
                    >
                      {task.assignedToName ? (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{task.assignedToName}</span>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "flex items-center gap-1",
                            isDark ? "text-slate-500" : "text-gray-400"
                          )}
                        >
                          <User className="w-3 h-3" />
                          <span>Unassigned</span>
                        </div>
                      )}
                      <div
                        className={cn(
                          "flex items-center gap-1",
                          getDueOrCompletedLabel(task).isOverdue &&
                            (isDark ? "text-red-400 font-medium" : "text-red-600 font-medium")
                        )}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{getDueOrCompletedLabel(task).text}</span>
                      </div>
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
                      <CheckCircle2
                        className={cn(
                          "w-5 h-5",
                          isDark ? "text-green-400" : "text-green-600"
                        )}
                      />
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
