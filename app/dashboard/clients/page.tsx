"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClientAvatar } from "@/components/ClientAvatar";
import {
  Plus,
  AlertCircle,
  Clock,
  CheckCircle2,
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import { LoadingScreen } from "@/components/LoadingScreen";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${
            "border-red-200 text-red-700 bg-red-50/50 dark:border-red-900/50 dark:text-red-400 dark:bg-red-950/20"
          }`}
        >
          <AlertCircle className="w-3 h-3" strokeWidth={2} />
          Payment Due
        </span>
      );
    }
    if (client.status === "paused" || client.status === "inactive") {
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${
            "border-amber-200 text-amber-700 bg-amber-50/50 dark:border-amber-900/50 dark:text-amber-400 dark:bg-amber-950/20"
          }`}
        >
          <Clock className="w-3 h-3" strokeWidth={2} />
          {client.status === "paused" ? "Paused" : "Inactive"}
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${
          "border-emerald-200 text-emerald-700 bg-emerald-50/50 dark:border-emerald-900/50 dark:text-emerald-400 dark:bg-emerald-950/20"
        }`}
      >
        <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
        Active
      </span>
    );
  };

  if (loading) {
    return (
      <LoadingScreen
        variant="inline"
        message="Loading clients..."
        subtitle="Fetching your accounts"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className={`text-2xl font-medium text-foreground`}
          >
            Clients
          </h1>
          <p
            className={`mt-1 text-sm text-muted-foreground`}
          >
            {clients.length} {clients.length === 1 ? "client" : "clients"}. Manage all your accounts
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/clients/new")}
          className={`shrink-0 ${
            "bg-gray-950 hover:bg-gray-900 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-gray-950"
          }`}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Search, filters, sort */}
      {clients.length > 0 && (
        <div className={`rounded-xl border p-4 ${
          "bg-white border-border dark:bg-slate-800/50 dark:border-slate-600"
        }`}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70`} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-slate-600 ${
                  "bg-muted border-border text-foreground placeholder-gray-400 dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:placeholder-slate-500"
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
                        ? "bg-gray-950 text-white dark:bg-white dark:text-gray-950"
                        : "bg-accent text-muted-foreground hover:bg-gray-200 dark:bg-slate-700/50 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    }`}
                  >
                    {f === "all" ? "All" : f === "active" ? "Active" : f === "payment_due" ? "Payment Due" : "On Hold"}
                  </button>
                ))}
              </div>
              <Select
                value={sortBy}
                onValueChange={(value) =>
                  setSortBy(value as "recent" | "name" | "payment")
                }
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recently added</SelectItem>
                  <SelectItem value="name">Name A–Z</SelectItem>
                  <SelectItem value="payment">Payment status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {(searchQuery || statusFilter !== "all") && (
            <p className={`mt-3 text-sm text-muted-foreground`}>
              Showing {totalFiltered} of {clients.length} clients
            </p>
          )}
        </div>
      )}

      {/* Clients List */}
      {clients.length === 0 ? (
        <Card
          className={`${
            "bg-white border-border dark:bg-slate-800 dark:border-slate-600"
          }`}
        >
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <div className={`w-14 h-14 mx-auto mb-4 rounded-xl border flex items-center justify-center border-border bg-muted`}>
                <Users
                  className={`w-6 h-6 text-muted-foreground/70`}
                  strokeWidth={1.75}
                />
              </div>
              <h2
                className={`text-lg font-medium mb-2 text-foreground`}
              >
                No clients yet
              </h2>
              <p
                className={`mb-6 text-muted-foreground`}
              >
                Get started by creating your first client
              </p>
              <Button
                onClick={() => router.push("/dashboard/clients/new")}
                className={
                  "bg-gray-950 hover:bg-gray-900 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-gray-950"
                }
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Client
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : totalFiltered === 0 ? (
        <Card className={"bg-card border-border"}>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <Search className={`w-12 h-12 mx-auto mb-4 text-muted-foreground/70`} />
              <h2 className={`text-lg font-semibold mb-2 text-foreground`}>
                No clients match your search
              </h2>
              <p className={`mb-4 text-muted-foreground`}>
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {paginatedClients.map((client) => (
            <Card
              key={client.id}
              className={`cursor-pointer transition-colors ${
                "hover:border-gray-300 dark:hover:border-slate-600"
              }`}
              onClick={() => router.push(`/dashboard/clients/${client.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <ClientAvatar
                    name={client.name}
                    logoUrl={client.logoUrl}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate text-foreground`}
                    >
                      {client.name}
                    </p>
                    {client.email ? (
                      <p
                        className={`text-xs mt-0.5 truncate text-muted-foreground`}
                      >
                        {client.email}
                      </p>
                    ) : (
                      <p
                        className={`text-xs mt-0.5 text-muted-foreground/70`}
                      >
                        No email
                      </p>
                    )}
                  </div>
                </div>
                <div
                  className={`flex items-center justify-between mt-3 pt-3 border-t ${
                    "border-border dark:border-slate-600"
                  }`}
                >
                  {getStatusBadge(client)}
                  <span
                    className={`text-xs tabular-nums text-muted-foreground/70`}
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
          <div className={`flex items-center justify-between pt-6 text-muted-foreground`}>
            <p className="text-sm">
              Page {page} of {totalPages} · {totalFiltered} clients
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={"dark:border-slate-600"}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className={"dark:border-slate-600"}
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
