"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Music2,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingScreen } from "@/components/LoadingScreen";

interface ScheduledPost {
  id: number;
  platform: string;
  content: string;
  scheduledFor: string;
  posted: boolean;
  approvalStatus?: string;
}

export default function CalendarPage() {
  const params = useParams();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const clientId = params?.clientId ? parseInt(params.clientId as string) : null;

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (!clientId) return;

    const fetchPosts = async () => {
      try {
        setLoading(true);
        // Fetch scheduled posts for this client
        const response = await fetch(`/api/clients/${clientId}/scheduled-posts`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts || []);
        }
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [clientId, currentDate]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getPostsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split("T")[0];
    return posts.filter((post) => {
      const postDate = new Date(post.scheduledFor).toISOString().split("T")[0];
      return postDate === dateStr;
    });
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const days = getDaysInMonth(currentDate);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "twitter":
        return Twitter;
      case "instagram":
        return Instagram;
      case "linkedin":
        return Linkedin;
      case "youtube":
        return Youtube;
      case "tiktok":
        return Music2;
      default:
        return Smartphone;
    }
  };

  if (loading) {
    return <LoadingScreen variant="inline" message="Loading calendar..." />;
  }

  return (
    <div className={`max-w-7xl mx-auto space-y-4 sm:space-y-6 transition-colors duration-300 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-background`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className={`p-2 transition-colors duration-200 ${
              "text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className={`text-xl sm:text-2xl font-bold text-foreground`}>Content Calendar</h1>
        </div>
        <Button
          onClick={() => router.push(`/dashboard/schedule?clientId=${clientId}`)}
          className="w-full sm:w-auto bg-primary hover:bg-primary/90 active:bg-purple-800 text-primary-foreground transition-all duration-200 shadow-sm hover:shadow-md py-2.5 sm:py-2 text-sm sm:text-base"
        >
          Schedule New Post
        </Button>
      </div>

      <Card className={`border shadow-sm transition-colors duration-300 bg-card border-border`}>
        <CardHeader className={`border-b transition-colors duration-300 px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-border bg-muted`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <CardTitle className={`text-base sm:text-lg font-semibold flex items-center gap-2 text-foreground`}>
              <CalendarIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${
                "text-foreground dark:text-purple-400"
              }`} />
              {monthName}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("prev")}
                className={`p-2 transition-all duration-200 ${
                  "border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-900 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-500 dark:hover:text-white"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className={`px-3 transition-all duration-200 ${
                  "border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-900 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-500 dark:hover:text-white"
                }`}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("next")}
                className={`p-2 transition-all duration-200 ${
                  "border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-900 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-500 dark:hover:text-white"
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6 px-2 sm:px-6">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Week day headers */}
            {weekDays.map((day) => (
              <div
                key={day}
                className={`text-center text-xs sm:text-sm font-semibold py-1 sm:py-2 text-muted-foreground`}
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((date, index) => {
              const dayPosts = getPostsForDate(date);
              const isCurrentDay = isToday(date);

              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[60px] sm:min-h-[80px] lg:min-h-[100px] border rounded-lg p-1 sm:p-2 transition-all duration-200",
                    date
                      ? "bg-white border-gray-200 hover:bg-gray-50 cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:border-slate-600 dark:cursor-pointer"
                      : "bg-gray-50 border-gray-200 dark:bg-slate-900 dark:border-slate-800",
                    isCurrentDay && isDark
                      ? "border-primary border bg-purple-950/50"
                      : isCurrentDay
                      ? "border-primary border bg-muted"
                      : ""
                  )}
                  onClick={() => {
                    if (date) {
                      // Could open a modal with day's posts
                    }
                  }}
                >
                  {date && (
                    <>
                      <div
                        className={cn(
                          "text-xs sm:text-sm font-medium mb-0.5 sm:mb-1",
                          isCurrentDay
                            ? "text-foreground dark:text-purple-400"
                            : "text-foreground"
                        )}
                      >
                        {date.getDate()}
                      </div>
                      <div className="space-y-0.5 sm:space-y-1">
                        {dayPosts.slice(0, 2).map((post) => (
                          <div
                            key={post.id}
                            className={cn(
                              "text-[10px] sm:text-xs p-1 sm:p-1.5 rounded truncate flex items-center gap-1",
                              post.posted
                                ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400 dark:border dark:border-green-800"
                                : post.approvalStatus === "pending"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400 dark:border dark:border-yellow-800"
                                : "bg-purple-100 text-foreground dark:bg-purple-950/50 dark:text-purple-400 dark:border dark:border-purple-800"
                            )}
                            title={post.content}
                          >
                            {(() => {
                              const PlatformIcon = getPlatformIcon(post.platform);
                              return <PlatformIcon className="w-3 h-3 shrink-0" />;
                            })()}
                            <span className="truncate flex-1">
                              {post.platform}
                            </span>
                            {post.approvalStatus === "pending" && (
                              <Clock className="w-3 h-3" />
                            )}
                            {post.posted && (
                              <CheckCircle2 className="w-3 h-3" />
                            )}
                          </div>
                        ))}
                        {dayPosts.length > 3 && (
                          <div className={`text-xs text-center text-muted-foreground`}>
                            +{dayPosts.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className={`border transition-colors duration-300 bg-card border-border`}>
        <CardContent className="pt-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded border ${
                "bg-purple-100 border-purple-200 dark:bg-purple-950/50 dark:border-purple-800"
              }`} />
              <span className={`text-sm text-foreground/80`}>Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded border ${
                "bg-yellow-100 border-yellow-200 dark:bg-yellow-950/50 dark:border-yellow-800"
              }`} />
              <span className={`text-sm text-foreground/80`}>Pending Approval</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded border ${
                "bg-green-100 border-green-200 dark:bg-green-950/50 dark:border-green-800"
              }`} />
              <span className={`text-sm text-foreground/80`}>Posted</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
