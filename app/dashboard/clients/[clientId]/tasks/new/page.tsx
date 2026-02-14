"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import {
  ArrowLeft,
  Loader2,
  Calendar,
  User,
  FileText,
} from "lucide-react";

interface TeamMember {
  id: number;
  name: string;
  email: string;
}

export default function NewTaskPage() {
  const params = useParams();
  const router = useRouter();
  const { userId } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const clientId = params?.clientId ? parseInt(params.clientId as string) : null;

  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [formData, setFormData] = useState({
    type: "write_caption",
    description: "",
    assignedTo: "",
    dueDate: "",
  });

  useEffect(() => {
    if (!clientId) {
      router.push("/dashboard");
      return;
    }

    // Fetch team members
    const fetchTeamMembers = async () => {
      try {
        const response = await fetch(`/api/team?userId=${userId}`, {
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

    if (userId) {
      fetchTeamMembers();
    }
  }, [clientId, userId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.type) {
      showToast.error("Task type required", "Please select a task type");
      return;
    }

    if (!userId) {
      showToast.error("Authentication required", "Please sign in to create tasks");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/clients/${clientId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          type: formData.type,
          description: formData.description.trim() || undefined,
          assignedTo: formData.assignedTo ? parseInt(formData.assignedTo) : null,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
          userId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showToast.success("Task created", "Task has been created successfully");
        router.push(`/dashboard/clients/${clientId}/tasks`);
      } else {
        const errorData = await response.json().catch(() => ({ error: "Failed to create task" }));
        showToast.error("Failed to create task", errorData.error || "Please try again");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      showToast.error("Error", "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const taskTypes = [
    { value: "design_image", label: "Design Image", icon: "🎨" },
    { value: "write_caption", label: "Write Caption", icon: "✍️" },
    { value: "review_copy", label: "Review Copy", icon: "📝" },
    { value: "approve", label: "Approve", icon: "✅" },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-slate-900" : "bg-white"}`}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center gap-3 sm:gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className={`p-2 transition-all duration-200 ${isDark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className={`text-xl sm:text-2xl font-bold ${isDark ? "text-white" : "text-gray-950"}`}>
            Create New Task
          </h1>
        </div>

        <Card className={`border transition-colors duration-300 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
          <CardHeader className={`${isDark ? "border-slate-700" : ""} px-4 sm:px-6 pt-4 sm:pt-6`}>
            <CardTitle className={`text-lg sm:text-xl ${isDark ? "text-white" : "text-gray-950"}`}>
              Task Details
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="type"
                  className={`block text-sm font-medium mb-3 ${isDark ? "text-slate-300" : "text-gray-700"}`}
                >
                  Task Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {taskTypes.map((taskType) => (
                    <button
                      key={taskType.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: taskType.value })}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                        formData.type === taskType.value
                          ? isDark
                            ? "border-purple-500 bg-purple-900/50 text-purple-300"
                            : "border-purple-600 bg-purple-50 text-purple-900"
                          : isDark
                            ? "border-slate-700 bg-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-slate-700"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-2xl">{taskType.icon}</span>
                      <span className="text-xs font-medium text-center">{taskType.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-xl resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${isDark ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400 hover:border-slate-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 hover:border-gray-400"}`}
                  rows={4}
                  placeholder="Describe what needs to be done..."
                />
              </div>

              <div>
                <label
                  htmlFor="assignedTo"
                  className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}
                >
                  Assign To
                </label>
                <div className="relative">
                  <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? "text-slate-400" : "text-gray-400"}`} />
                  <select
                    id="assignedTo"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${isDark ? "bg-slate-700 border-slate-600 text-white hover:border-slate-500" : "bg-white border-gray-300 text-gray-900 hover:border-gray-400"}`}
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="dueDate"
                  className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}
                >
                  Due Date
                </label>
                <div className="relative">
                  <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? "text-slate-400" : "text-gray-400"}`} />
                  <input
                    type="datetime-local"
                    id="dueDate"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${isDark ? "bg-slate-700 border-slate-600 text-white hover:border-slate-500" : "bg-white border-gray-300 text-gray-900 hover:border-gray-400"}`}
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                  className={`flex-1 sm:flex-none transition-all duration-200 py-2.5 sm:py-2 ${isDark ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white" : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-900"}`}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white transition-all duration-200 shadow-sm hover:shadow-md py-2.5 sm:py-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Create Task
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
