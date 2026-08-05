"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Plus,
  AlertCircle,
  Clock,
  CheckCircle2,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface Client {
  id: number;
  name: string;
  logoUrl?: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  email?: string;
}

export default function ClientsPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "payment_due" | "on_hold">("all");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "payment">("recent");
  const [page, setPage] = useState(1);
  const CLIENTS_PER_PAGE = 12;

  useEffect(() => {
    const fetchClients = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/clients?userId=${userId}`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setClients(data.clients || []);
        } else {
          // Only log errors, don't show toast for normal "no data" scenarios
          const errorData = await response.json().catch(() => ({}));
          console.error("Failed to fetch clients:", response.status, errorData);
          // Only show error for actual failures, not just empty data
          if (response.status !== 404 && response.status !== 200) {
            // Silent fail - just set empty array
            setClients([]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch clients:", error);
        // Silent fail - just set empty array, don't show toast
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [userId]);

  // Filter, sort, and paginate clients
  const { totalPages, paginatedClients, totalFiltered } = useMemo(() => {
    let list = clients;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((c) => {
        if (statusFilter === "active") return c.status === "active" && c.paymentStatus === "paid";
        if (statusFilter === "payment_due") return c.paymentStatus === "overdue";
        if (statusFilter === "on_hold") return c.status === "paused" || c.status === "inactive";
        return true;
      });
    }
    const sorted = [...list].sort((a, b) => {
      if (sortBy === "recent") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "payment") {
        const order = { overdue: 0, pending: 1, paid: 2 };
        return (order[a.paymentStatus as keyof typeof order] ?? 2) - (order[b.paymentStatus as keyof typeof order] ?? 2);
      }
      return 0;
    });
    const total = sorted.length;
    const pages = Math.max(1, Math.ceil(total / CLIENTS_PER_PAGE));
    const start = (page - 1) * CLIENTS_PER_PAGE;
    const paginated = sorted.slice(start, start + CLIENTS_PER_PAGE);
    return {
      totalPages: pages,
      paginatedClients: paginated,
      totalFiltered: total,
    };
  }, [clients, searchQuery, statusFilter, sortBy, page]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, sortBy]);

  const getStatusBadge = (client: Client) => {
    if (client.paymentStatus === "overdue") {
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            isDark
              ? "bg-red-950/50 text-red-400"
              : "bg-red-100 text-red-700"
          }`}
        >
          <AlertCircle className="w-3 h-3" />
          Payment Due
        </span>
      );
    }
    if (client.status === "paused" || client.status === "inactive") {
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            isDark
              ? "bg-yellow-950/50 text-yellow-400"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          <Clock className="w-3 h-3" />
          {client.status === "paused" ? "Paused" : "Inactive"}
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          isDark
            ? "bg-green-950/50 text-green-400"
            : "bg-green-100 text-green-700"
        }`}
      >
        <CheckCircle2 className="w-3 h-3" />
        Active
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-4" />
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}>
            Loading clients...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className={`text-3xl font-bold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Clients
          </h1>
          <p
            className={`mt-1 text-sm ${
              isDark ? "text-slate-400" : "text-gray-600"
            }`}
          >
            {clients.length} {clients.length === 1 ? "client" : "clients"} — manage all your accounts
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/clients/new")}
          className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Search, filters, sort */}
      {clients.length > 0 && (
        <div className={`rounded-xl border p-4 ${
          isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-200"
        }`}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                isDark ? "text-slate-500" : "text-gray-400"
              }`} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  isDark
                    ? "bg-slate-900 border-slate-600 text-white placeholder-slate-500"
                    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                }`}
                aria-label="Search clients"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex gap-1">
                {(["all", "active", "payment_due", "on_hold"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setStatusFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === f
                        ? "bg-purple-600 text-white"
                        : isDark
                          ? "bg-slate-700 text-slate-400 hover:bg-slate-600"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {f === "all" ? "All" : f === "active" ? "Active" : f === "payment_due" ? "Payment Due" : "On Hold"}
                  </button>
                ))}
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "recent" | "name" | "payment")}
                className={`px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  isDark
                    ? "bg-slate-800 border-slate-600 text-white"
                    : "bg-white border-gray-200 text-gray-900"
                }`}
              >
                <option value="recent">Recently added</option>
                <option value="name">Name A–Z</option>
                <option value="payment">Payment status</option>
              </select>
            </div>
          </div>
          {(searchQuery || statusFilter !== "all") && (
            <p className={`mt-3 text-sm ${
              isDark ? "text-slate-400" : "text-gray-600"
            }`}>
              Showing {totalFiltered} of {clients.length} clients
            </p>
          )}
        </div>
      )}

      {/* Clients List */}
      {clients.length === 0 ? (
        <Card
          className={`${
            isDark
              ? "bg-slate-800 border-slate-700"
              : "bg-white border-gray-200"
          }`}
        >
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <Building2
                className={`w-16 h-16 mx-auto mb-4 ${
                  isDark ? "text-slate-600" : "text-gray-400"
                }`}
              />
              <h2
                className={`text-xl font-semibold mb-2 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                No clients yet
              </h2>
              <p
                className={`mb-6 ${
                  isDark ? "text-slate-400" : "text-gray-600"
                }`}
              >
                Get started by creating your first client
              </p>
              <Button
                onClick={() => router.push("/dashboard/clients/new")}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Client
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : totalFiltered === 0 ? (
        <Card className={isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <Search className={`w-12 h-12 mx-auto mb-4 ${
                isDark ? "text-slate-500" : "text-gray-400"
              }`} />
              <h2 className={`text-lg font-semibold mb-2 ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                No clients match your search
              </h2>
              <p className={`mb-4 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                Try adjusting your search or filters
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
              >
                Clear filters
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedClients.map((client) => (
            <Card
              key={client.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isDark
                  ? "bg-slate-800 border-slate-700 hover:border-purple-600"
                  : "bg-white border-gray-200 hover:border-purple-300"
              }`}
              onClick={() => router.push(`/dashboard/clients/${client.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {client.logoUrl ? (
                      <img
                        src={client.logoUrl}
                        alt={client.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div>
                      <CardTitle
                        className={`text-lg ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {client.name}
                      </CardTitle>
                      {client.email && (
                        <p
                          className={`text-xs mt-1 ${
                            isDark ? "text-slate-400" : "text-gray-500"
                          }`}
                        >
                          {client.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  {getStatusBadge(client)}
                  <span
                    className={`text-xs ${
                      isDark ? "text-slate-500" : "text-gray-400"
                    }`}
                  >
                    {new Date(client.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`flex items-center justify-between pt-6 ${
            isDark ? "text-slate-400" : "text-gray-600"
          }`}>
            <p className="text-sm">
              Page {page} of {totalPages} · {totalFiltered} clients
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={isDark ? "border-slate-600" : ""}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className={isDark ? "border-slate-600" : ""}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  );
}
