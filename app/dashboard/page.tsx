"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { Logo } from "@/components/Logo";
import {
  TrendingUp,
  TrendingDown,
  Bell,
  Search,
  MapPin,
  MoreVertical,
  Loader2,
  Plus,
  Building2,
} from "lucide-react";
import { ActivityFeed } from "@/components/ActivityFeed";
// Chart component will be created inline

interface DashboardStats {
  totalContent: number;
  scheduledPosts: number;
  teamMembers: number;
  thisWeekContent: number;
  engagementRate: number;
  topPlatform: string;
}

// Dummy data for charts
const engagementData = [
  { month: "Jul", Facebook: 45, Instagram: 38, LinkedIn: 32 },
  { month: "Aug", Facebook: 48, Instagram: 42, LinkedIn: 35 },
  { month: "Sep", Facebook: 52, Instagram: 45, LinkedIn: 38 },
  { month: "Oct", Facebook: 50, Instagram: 48, LinkedIn: 40 },
  { month: "Nov", Facebook: 55, Instagram: 52, LinkedIn: 42 },
  { month: "Dec", Facebook: 58, Instagram: 55, LinkedIn: 45 },
];

const topGeographies = [
  { country: "Lagos, Nigeria", rate: 65.1 },
  { country: "Abuja, Nigeria", rate: 50.5 },
  { country: "Port Harcourt, Nigeria", rate: 39.2 },
  { country: "Ibadan, Nigeria", rate: 9.2 },
];

const commentsData = [
  {
    name: "Amina Okafor",
    handle: "@amina_social",
    location: "Lagos, Nigeria",
    time: "31 Jan 12.30 AM",
    avatar: "A",
  },
  {
    name: "Chukwu Emeka",
    handle: "@chukwu_digital",
    location: "Abuja, Nigeria",
    time: "30 Jan 3.45 PM",
    avatar: "C",
  },
  {
    name: "Fatima Bello",
    handle: "@fatima_media",
    location: "Port Harcourt, Nigeria",
    time: "30 Jan 11.20 AM",
    avatar: "F",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { userId, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const [stats, setStats] = useState<DashboardStats>({
    totalContent: 224,
    scheduledPosts: 12,
    teamMembers: 1,
    thisWeekContent: 18,
    engagementRate: 8,
    topPlatform: "Instagram",
  });
  const [loading, setLoading] = useState(true);

  const [clients, setClients] = useState<any[]>([]);
  const [hasClients, setHasClients] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Check for clients on mount
  useEffect(() => {
    const checkClients = async () => {
      if (!userId) return;
      try {
        const response = await fetch(`/api/clients?userId=${userId}`, {
          credentials: "include",
        });
        
        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error("[Dashboard] Non-JSON response from /api/clients:", text.substring(0, 200));
          return;
        }
        
        if (response.ok) {
          const data = await response.json();
          setClients(data.clients || []);
          setHasClients((data.clients || []).length > 0);
          
          // Auto-redirect to first client if clients exist
          if (data.clients && data.clients.length > 0 && !redirecting) {
            const firstClient = data.clients[0];
            setRedirecting(true);
            // Use router.push to avoid hooks issues
            router.push(`/dashboard/clients/${firstClient.id}`);
          }
        }
      } catch (error) {
        console.error("Error checking clients:", error);
      }
    };
    
    // Only check if auth is loaded
    if (authLoaded && userId) {
      checkClients();
    }
  }, [userId, authLoaded]);

  const fetchDashboardStats = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      // Use cache: 'force-cache' for better performance, with revalidation
      const response = await fetch(`/api/dashboard/stats?userId=${userId}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        next: { revalidate: 60 }, // Revalidate every 60 seconds
      });
      
      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("[Dashboard] Non-JSON response from /api/dashboard/stats:", text.substring(0, 200));
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalContent: data.totalContent || 224,
          scheduledPosts: data.scheduledPosts || 12,
          teamMembers: data.teamMembers || 1,
          thisWeekContent: data.thisWeekContent || 18,
          engagementRate: data.engagementRate || 8,
          topPlatform: data.topPlatform || "Instagram",
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    // Wait for auth to load first
    if (!authLoaded || !userLoaded) {
      setLoading(true);
      return;
    }

    if (userId) {
      fetchDashboardStats();
    } else {
      setLoading(false);
    }
  }, [userId, authLoaded, userLoaded, fetchDashboardStats]);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const userName = user?.firstName || user?.fullName || "User";
  // const userEmail = user?.primaryEmailAddress?.emailAddress || "";

  // Show welcome message if no clients
  if (!hasClients && !loading && userId) {
    const { resolvedTheme } = useTheme();
    const isDarkEmpty = resolvedTheme === "dark";
    return (
      <div className={`min-h-screen transition-colors duration-300 ${
        isDarkEmpty ? "bg-slate-900" : "bg-white"
      }`}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h1 className={`text-3xl font-bold mb-2 ${
              isDarkEmpty ? "text-white" : "text-gray-900"
            }`}>
              Welcome to Revvy, {userName}!
            </h1>
            <p className={`text-lg ${
              isDarkEmpty ? "text-slate-400" : "text-gray-600"
            }`}>
              Get started by creating your first client
            </p>
          </div>

          <Card className={`border rounded-xl ${
            isDarkEmpty ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
          }`}>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Building2 className={`w-16 h-16 mx-auto mb-4 ${
                  isDarkEmpty ? "text-purple-400" : "text-purple-600"
                }`} />
                <h2 className={`text-xl font-semibold mb-2 ${
                  isDarkEmpty ? "text-white" : "text-gray-900"
                }`}>
                  No clients yet
                </h2>
                <p className={`mb-6 ${
                  isDarkEmpty ? "text-slate-400" : "text-gray-600"
                }`}>
                  Create your first client to start managing their social media content
                </p>
                <Button
                  onClick={() => window.location.href = "/dashboard/clients/new"}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Client
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Get current week dates
  const getWeekDates = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    const weekStart = new Date(today.setDate(diff));
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push({
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        date: date.getDate(),
        isToday: i === 0,
      });
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Show loading state
  if (loading || !authLoaded || !userLoaded) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDark ? "bg-slate-900" : "bg-white"
      }`}>
        <div className="text-center max-w-md mx-auto px-4">
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`w-28 h-28 rounded-full animate-pulse ${
                  isDark ? "bg-purple-500/20" : "bg-purple-100"
                }`}></div>
              </div>
              <div className="relative w-20 h-20 flex items-center justify-center">
                <Logo size="lg" variant="icon" />
              </div>
            </div>
            <div className="flex space-x-2 justify-center mt-4">
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
          <h2 className={`text-xl font-bold mb-2 ${
            isDark ? "text-white" : "text-gray-950"
          }`}>
            Loading Dashboard...
          </h2>
          <p className={isDark ? "text-slate-400" : "text-gray-600"}>
            Please wait while we load your dashboard data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen max-w-8xl mx-auto transition-colors duration-300 flex flex-col ${
      isDark ? "bg-slate-900" : "bg-white"
    }`}>
      {/* Top Header */}
      <div className={`sticky top-0 z-10 border-b px-4 sm:px-6 lg:px-8 py-3 sm:py-4 transition-colors duration-300 ${
        isDark
          ? "bg-slate-900 border-slate-700"
          : "bg-white border-gray-200"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className={`text-xl sm:text-2xl font-bold truncate ${
              isDark ? "text-white" : "text-gray-950"
            }`}>
              Welcome, {userName}
          </h1>
            <p className={`text-xs sm:text-sm mt-0.5 sm:mt-1 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}>{currentDate}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative">
              <Bell className={`w-5 h-5 cursor-pointer ${
                isDark
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-600 hover:text-gray-950"
              }`} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </div>
            <div className="relative flex-1 sm:flex-none">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`} />
              <input
                type="text"
                placeholder="Search..."
                className={`pl-9 pr-8 py-2 w-full sm:w-48 lg:w-64 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                  isDark
                    ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                    : "border-gray-200"
                }`}
              />
              <span className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-xs hidden sm:inline ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}>
                /
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="w-full max-w-7xl space-y-4 sm:space-y-6">
          {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className={`border rounded-xl transition-colors shadow-sm ${
            isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
          }`}>
            <CardContent className="p-4 sm:p-6">
              <div className={`text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}>
                Total posts
              </div>
              <div className={`text-2xl sm:text-3xl font-bold mb-1.5 sm:mb-2 ${
                isDark ? "text-white" : "text-gray-950"
              }`}>
                {loading ? (
                  <div className="h-8 sm:h-9 w-16 sm:w-20 bg-gray-200 rounded animate-pulse" />
                ) : (
                  stats.totalContent
                )}
              </div>
              <div className="flex items-center gap-1 text-xs sm:text-sm font-medium text-green-600">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="truncate">▲+55% since last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className={`border rounded-xl transition-colors shadow-sm ${
            isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
          }`}>
            <CardContent className="p-4 sm:p-6">
              <div className={`text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}>
                Post likes
              </div>
              <div className={`text-2xl sm:text-3xl font-bold mb-1.5 sm:mb-2 ${
                isDark ? "text-white" : "text-gray-950"
              }`}>
                2.4M
              </div>
              <div className="flex items-center gap-1 text-xs sm:text-sm font-medium text-red-600">
                <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="truncate">▼-25% since last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className={`border rounded-xl sm:col-span-2 lg:col-span-1 transition-colors ${
            isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
          }`}>
            <CardContent className="p-4 sm:p-6">
              <div className={`text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}>
                Total comments
              </div>
              <div className={`text-2xl sm:text-3xl font-bold mb-1.5 sm:mb-2 ${
                isDark ? "text-white" : "text-gray-950"
              }`}>
                3.5M
              </div>
              <div className="flex items-center gap-1 text-xs sm:text-sm font-medium text-green-600">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="truncate">▲+15% since last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed */}
        <ActivityFeed maxItems={20} autoRefresh={true} />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - 2 spans */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* My Social Overview */}
            <Card className={`border rounded-xl transition-colors shadow-sm ${
              isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
            }`}>
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
                  <CardTitle className={`text-base sm:text-lg font-semibold ${
                    isDark ? "text-white" : "text-gray-950"
                  }`}>
                    My social overview
                </CardTitle>
                  <div className="flex items-center gap-2">
                    <select className={`flex-1 sm:flex-none text-xs sm:text-sm border rounded-lg px-2 sm:px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      isDark 
                        ? "bg-slate-700 border-slate-600 text-slate-200" 
                        : "bg-white border-gray-200 text-gray-700"
                    }`}>
                      <option>Jul 2024 - Dec 2024</option>
                      <option>Jan 2024 - Jun 2024</option>
                    </select>
                    <select className={`flex-1 sm:flex-none text-xs sm:text-sm border rounded-lg px-2 sm:px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      isDark 
                        ? "bg-slate-700 border-slate-600 text-slate-200" 
                        : "bg-white border-gray-200 text-gray-700"
                    }`}>
                      <option>Engagement</option>
                      <option>Reach</option>
                      <option>Impressions</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="space-y-4 sm:space-y-6">
                  {/* Line Chart */}
                  <div className="h-48 sm:h-64 relative overflow-x-auto">
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 600 200"
                      className="overflow-visible"
                    >
                      {/* Grid lines */}
                      {[0, 15, 30, 45, 60].map((y, i) => (
                        <g key={i}>
                          <line
                            x1="40"
                            y1={180 - (y / 60) * 160}
                            x2="560"
                            y2={180 - (y / 60) * 160}
                            stroke={isDark ? "#334155" : "#e5e7eb"}
                            strokeWidth="1"
                            strokeDasharray="3 3"
                          />
                          <text
                            x="35"
                            y={180 - (y / 60) * 160 + 4}
                            fill={isDark ? "#94A3B8" : "#6b7280"}
                            fontSize="10"
                            textAnchor="end"
                          >
                            {y}%
                          </text>
                        </g>
                      ))}

                      {/* X-axis labels */}
                      {engagementData.map((item, i) => (
                        <text
                          key={i}
                          x={60 + (i * 100)}
                          y="195"
                          fill={isDark ? "#94A3B8" : "#6b7280"}
                          fontSize="11"
                          textAnchor="middle"
                        >
                          {item.month}
                        </text>
                      ))}

                      {/* Facebook line (blue) */}
                      <polyline
                        points={engagementData
                          .map(
                            (item, i) =>
                              `${60 + i * 100},${180 - (item.Facebook / 60) * 160}`
                          )
                          .join(" ")}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                      />
                      {engagementData.map((item, i) => (
                        <circle
                          key={`fb-${i}`}
                          cx={60 + i * 100}
                          cy={180 - (item.Facebook / 60) * 160}
                          r="4"
                          fill="#3b82f6"
                        />
                      ))}

                      {/* Instagram line (black) */}
                      <polyline
                        points={engagementData
                          .map(
                            (item, i) =>
                              `${60 + i * 100},${180 - (item.Instagram / 60) * 160}`
                          )
                          .join(" ")}
                        fill="none"
                        stroke="#1f2937"
                        strokeWidth="2"
                      />
                      {engagementData.map((item, i) => (
                        <circle
                          key={`ig-${i}`}
                          cx={60 + i * 100}
                          cy={180 - (item.Instagram / 60) * 160}
                          r="4"
                          fill="#1f2937"
                        />
                      ))}

                      {/* LinkedIn line (teal) */}
                      <polyline
                        points={engagementData
                          .map(
                            (item, i) =>
                              `${60 + i * 100},${180 - (item.LinkedIn / 60) * 160}`
                          )
                          .join(" ")}
                        fill="none"
                        stroke="#14b8a6"
                        strokeWidth="2"
                      />
                      {engagementData.map((item, i) => (
                        <circle
                          key={`li-${i}`}
                          cx={60 + i * 100}
                          cy={180 - (item.LinkedIn / 60) * 160}
                          r="4"
                          fill="#14b8a6"
                        />
                      ))}
                    </svg>

                    {/* Legend */}
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-3 sm:gap-6 mt-2 flex-wrap">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-500"></div>
                        <span className="text-xs text-gray-600">Facebook</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-purple-600"></div>
                        <span className="text-xs text-gray-600">Instagram</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-teal-500"></div>
                        <span className="text-xs text-gray-600">LinkedIn</span>
                      </div>
                    </div>
                  </div>

                  {/* World Map Placeholder */}
                  <div className={`h-40 sm:h-48 rounded-xl border flex items-center justify-center ${
                    isDark 
                      ? "bg-slate-900 border-slate-700" 
                      : "bg-gray-50 border-gray-200"
                  }`}>
                    <div className="text-center px-4">
                      <MapPin className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 ${
                        isDark ? "text-slate-500" : "text-gray-400"
                      }`} />
                      <p className={`text-xs sm:text-sm font-medium ${
                        isDark ? "text-slate-300" : "text-gray-600"
                      }`}>
                        Top geographies
                      </p>
                      <p className={`text-xs mt-1 ${
                        isDark ? "text-slate-500" : "text-gray-500"
                      }`}>
                        Map visualization
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Rate Metrics */}
            <Card className={`border rounded-xl transition-colors shadow-sm ${
              isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
            }`}>
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className={`text-base sm:text-lg font-semibold ${
                  isDark ? "text-white" : "text-gray-950"
                }`}>
                  Engagement rate metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg border ${
                    isDark ? "bg-slate-900 border-slate-800" : "bg-gray-50 border-gray-200"
                  }`}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm sm:text-base font-semibold ${
                        isDark ? "text-white" : "text-gray-950"
                      }`}>
                        Engagement rate (per impression)
                      </p>
      </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <p className={`text-base sm:text-lg font-bold ${
                        isDark ? "text-white" : "text-gray-950"
                      }`}>5.0%</p>
                      <span className="text-xs sm:text-sm font-medium text-red-600 whitespace-nowrap">
                        ▼12.7%
                      </span>
                    </div>
                  </div>
                  <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg border ${
                    isDark ? "bg-slate-900 border-slate-800" : "bg-gray-50 border-gray-200"
                  }`}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm sm:text-base font-semibold ${
                        isDark ? "text-white" : "text-gray-950"
                      }`}>
                        Facebook engagement rate
                      </p>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <p className={`text-base sm:text-lg font-bold ${
                        isDark ? "text-white" : "text-gray-950"
                      }`}>5.0%</p>
                      <span className="text-xs sm:text-sm font-medium text-red-600 whitespace-nowrap">
                        ▼12.7%
                      </span>
        </div>
      </div>
                  <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg border ${
                    isDark ? "bg-slate-900 border-slate-800" : "bg-gray-50 border-gray-200"
                  }`}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm sm:text-base font-semibold ${
                        isDark ? "text-white" : "text-gray-950"
                      }`}>
                        Instagram engagement rate
                      </p>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <p className={`text-base sm:text-lg font-bold ${
                        isDark ? "text-white" : "text-gray-950"
                      }`}>12.3%</p>
                      <span className="text-xs sm:text-sm font-medium text-green-600 whitespace-nowrap">
                        ▲3.5%
                      </span>
                    </div>
                  </div>
                  <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg border ${
                    isDark ? "bg-slate-900 border-slate-800" : "bg-gray-50 border-gray-200"
                  }`}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm sm:text-base font-semibold ${
                        isDark ? "text-white" : "text-gray-950"
                      }`}>
                        Linkedin engagement rate
                      </p>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <p className={`text-base sm:text-lg font-bold ${
                        isDark ? "text-white" : "text-gray-950"
                      }`}>4.5%</p>
                      <span className="text-xs sm:text-sm font-medium text-red-600 whitespace-nowrap">
                        ▼9.7%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-4 sm:space-y-6">
            {/* Top Geographies */}
            <Card className={`border rounded-xl transition-colors shadow-sm ${
              isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
            }`}>
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className={`text-base sm:text-lg font-semibold ${
                  isDark ? "text-white" : "text-gray-950"
                }`}>
                  Top geographies
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="space-y-3 sm:space-y-4">
                  {topGeographies.map((geo, idx) => (
                    <div key={idx} className="space-y-1.5 sm:space-y-2">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs sm:text-sm font-medium truncate flex-1 min-w-0 pr-2 ${
                          isDark ? "text-slate-200" : "text-gray-950"
                        }`}>
                          {geo.country}
                        </p>
                        <p className={`text-xs sm:text-sm font-bold whitespace-nowrap ${
                          isDark ? "text-white" : "text-gray-950"
                        }`}>
                          {geo.rate}%
                        </p>
              </div>
                      <div className={`w-full rounded-full h-1.5 sm:h-2 ${
                        isDark ? "bg-slate-700" : "bg-gray-200"
                      }`}>
                        <div
                          className="bg-teal-500 h-1.5 sm:h-2 rounded-full"
                          style={{ width: `${geo.rate}%` }}
                        ></div>
              </div>
                    </div>
                  ))}
            </div>
          </CardContent>
        </Card>

            {/* My Post Planner */}
            <Card className={`border rounded-xl transition-colors shadow-sm ${
              isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
            }`}>
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className={`text-base sm:text-lg font-semibold ${
                  isDark ? "text-white" : "text-gray-950"
                }`}>
                  My post planner
            </CardTitle>
          </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 sm:-mx-6 px-4 sm:px-6">
                  {weekDates.map((date, idx) => (
                    <div
                      key={idx}
                      className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-lg text-center min-w-[60px] sm:min-w-[70px] ${
                        date.isToday
                          ? "bg-purple-600 text-white"
                          : isDark
                          ? "bg-slate-700 text-slate-200 hover:bg-slate-600"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <div className="text-xs font-medium">{date.day}</div>
                      <div className="text-sm font-semibold mt-1">
                        {date.date}
                  </div>
                </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Comments and Mentions */}
            <Card className={`border rounded-xl transition-colors shadow-sm ${
              isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
            }`}>
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className={`text-base sm:text-lg font-semibold ${
                  isDark ? "text-white" : "text-gray-950"
                }`}>
                  Comments and mentions
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="space-y-3 sm:space-y-4">
                  {commentsData.map((comment, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg transition-colors ${
                        isDark ? "hover:bg-slate-700" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isDark ? "bg-purple-800 text-purple-200" : "bg-blue-100 text-blue-700"
                      }`}>
                        <span className={`text-xs sm:text-sm font-semibold ${
                          isDark ? "text-purple-200" : "text-blue-700"
                        }`}>
                          {comment.avatar}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                          <p className={`text-xs sm:text-sm font-semibold ${
                            isDark ? "text-white" : "text-gray-950"
                          }`}>
                            {comment.name}
                          </p>
                          <p className={`text-xs ${
                            isDark ? "text-slate-400" : "text-gray-500"
                          }`}>
                            {comment.handle}
                          </p>
              </div>
                        <p className={`text-xs mb-0.5 sm:mb-1 ${
                          isDark ? "text-slate-300" : "text-gray-600"
                        }`}>
                          {comment.location}
                        </p>
                        <p className={`text-xs ${
                          isDark ? "text-slate-500" : "text-gray-500"
                        }`}>
                          {comment.time}
                        </p>
                  </div>
                      <MoreVertical className={`w-4 h-4 cursor-pointer flex-shrink-0 ${
                        isDark ? "text-slate-500 hover:text-white" : "text-gray-400 hover:text-gray-600"
                      }`} />
                </div>
                  ))}
                </div>
              </CardContent>
            </Card>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
