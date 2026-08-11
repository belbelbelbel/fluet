"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { 
  ChevronDown, 
  Plus, 
  Building2, 
  Check,
  AlertCircle,
  Clock,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientAvatar } from "@/components/ClientAvatar";
import { cn } from "@/lib/utils";

interface Client {
  id: number;
  name: string;
  logoUrl?: string;
  email?: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface ClientSelectorProps {
  /** Clerk userId – when passed, fetch uses ?userId= so API always gets auth even if cookies lag */
  userId?: string | null;
  selectedClientId?: number | null;
  onClientChange?: (clientId: number | null) => void;
  /** When false, do not auto-pick the first client; show optional empty state */
  autoSelectFirst?: boolean;
}

export function ClientSelector({ userId, selectedClientId, onClientChange, autoSelectFirst = true }: ClientSelectorProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "payment_due" | "on_hold">("all");
  const retryRef = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const fetchClients = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const url = `/api/clients?userId=${encodeURIComponent(userId)}`;
      const response = await fetch(url, { credentials: "include" });
      const contentType = response.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");
      if (!isJson) {
        if (!retryRef.current) {
          retryRef.current = true;
          setTimeout(() => fetchClients(), 600);
        } else {
          setClients([]);
        }
        setLoading(false);
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401 && !retryRef.current) {
          retryRef.current = true;
          setTimeout(() => fetchClients(), 600);
        } else {
          setClients([]);
        }
        setLoading(false);
        return;
      }
      retryRef.current = false;
      const fetchedClients = Array.isArray(data.clients) ? data.clients : [];
      setClients(fetchedClients);

      const norm = (id: unknown) => (typeof id === "number" ? id : Number(id));
      const currentId = selectedClientId != null ? norm(selectedClientId) : null;

      // Only set selection for display; never call onClientChange here (would redirect away from Reports etc.)
      if (currentId != null) {
        const client = fetchedClients.find((c: Client) => norm(c.id) === currentId);
        if (client) {
          setSelectedClient(client);
        } else if (fetchedClients.length > 0 && autoSelectFirst) {
          setSelectedClient(fetchedClients[0]);
        } else {
          setSelectedClient(null);
        }
      } else if (fetchedClients.length > 0 && autoSelectFirst) {
        setSelectedClient(fetchedClients[0]);
      } else {
        setSelectedClient(null);
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      if (!retryRef.current) {
        retryRef.current = true;
        setTimeout(() => fetchClients(), 600);
      } else {
        setClients([]);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, selectedClientId, autoSelectFirst]);

  // Fetch when we have userId (from header); refetch when selectedClientId or userId changes
  useEffect(() => {
    if (userId == null || userId === "") {
      setLoading(true);
      setClients([]);
      setSelectedClient(null);
      return;
    }
    retryRef.current = false;
    fetchClients();
  }, [userId, selectedClientId, fetchClients]);

  // When clients load and we have no selection, show first client (display only)
  useEffect(() => {
    if (autoSelectFirst && clients.length > 0 && !selectedClient) {
      setSelectedClient(clients[0]);
    }
  }, [clients, selectedClient, autoSelectFirst]);

  // Listen for client creation events to refresh the list
  useEffect(() => {
    const handleClientCreated = () => fetchClients();
    window.addEventListener("clientCreated", handleClientCreated);
    return () => window.removeEventListener("clientCreated", handleClientCreated);
  }, []);

  const handleClearClient = () => {
    setSelectedClient(null);
    setOpen(false);
    setSearchQuery("");
    setStatusFilter("all");
    onClientChange?.(null);
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setOpen(false);
    setSearchQuery("");
    setStatusFilter("all");
    onClientChange?.(client.id);
    
    // Update URL if on client-specific page
    if (pathname.includes("/clients/")) {
      router.push(`/dashboard/clients/${client.id}`);
    }
  };

  const handleCreateClient = () => {
    setOpen(false);
    setSearchQuery("");
    setStatusFilter("all");
    router.push("/dashboard/clients/new");
  };

  // Filter clients by search and status
  const filteredClients = useMemo(() => {
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
    return list;
  }, [clients, searchQuery, statusFilter]);

  // Focus search when dropdown opens
  useEffect(() => {
    if (open && clients.length > 0) {
      setSearchQuery("");
      setStatusFilter("all");
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [open, clients.length]);

  const getStatusBadge = (client: Client) => {
    if (client.paymentStatus === "overdue") {
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
          isDark ? "bg-red-950/50 text-red-400" : "bg-red-100 text-red-700"
        }`}>
          <AlertCircle className="w-3 h-3" />
          Payment Due
        </span>
      );
    }
    if (client.status === "paused") {
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
          isDark ? "bg-yellow-950/50 text-yellow-400" : "bg-yellow-100 text-yellow-700"
        }`}>
          <Clock className="w-3 h-3" />
          Paused
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        isDark ? "bg-green-950/50 text-green-400" : "bg-green-100 text-green-700"
      }`}>
        Active
      </span>
    );
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  if (loading) {
    return (
      <div className={`h-10 w-48 rounded-lg animate-pulse ${
        isDark ? "bg-slate-700" : "bg-gray-100"
      }`} />
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setOpen(!open)}
        className={cn(
          "h-10 min-w-[200px] justify-between text-sm font-medium transition-all duration-200",
          isDark
            ? "border-slate-600 bg-slate-800 hover:bg-slate-700 hover:border-slate-500 text-slate-200"
            : "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-900"
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedClient ? (
            <ClientAvatar
              name={selectedClient.name}
              logoUrl={selectedClient.logoUrl}
              size="sm"
            />
          ) : (
            <Building2 className={`w-4 h-4 flex-shrink-0 ${
              isDark ? "text-slate-500" : "text-gray-400"
            }`} strokeWidth={1.75} />
          )}
          <span className="truncate">
            {selectedClient
              ? selectedClient.name
              : clients.length === 0
                ? "No clients"
                : autoSelectFirst
                  ? "Select client"
                  : "Select client (optional)"}
          </span>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 flex-shrink-0 ml-2 transition-transform",
          isDark ? "text-slate-400" : "text-gray-400",
          open && "rotate-180"
        )} />
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className={`absolute z-50 mt-2 w-[320px] rounded-lg border border-gray-200 dark:border-slate-600 ${
            isDark 
              ? "bg-slate-800" 
              : "bg-white"
          }`}>
            <div className="p-2">
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className={`text-xs font-semibold uppercase tracking-wider ${
                  isDark ? "text-slate-400" : "text-gray-500"
                }`}>
                  Clients {clients.length > 0 && (
                    <span className="font-normal normal-case ml-1">({clients.length})</span>
                  )}
                </span>
              </div>
              {clients.length > 5 && (
                <>
                  <div className="relative px-2 mb-2">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      isDark ? "text-slate-500" : "text-gray-400"
                    }`} />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search clients..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-slate-600 ${
                        isDark
                          ? "bg-slate-900 border-slate-600 text-white placeholder-slate-500"
                          : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                      }`}
                      aria-label="Search clients"
                    />
                  </div>
                  <div className="flex gap-1 px-2 mb-2 overflow-x-auto">
                    {(["all", "active", "payment_due", "on_hold"] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setStatusFilter(f)}
                        className={cn(
                          "shrink-0 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                          statusFilter === f
                            ? isDark
                              ? "bg-white text-gray-950"
                              : "bg-gray-950 text-white"
                            : isDark
                              ? "bg-slate-700 text-slate-400 hover:bg-slate-600"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        {f === "all" ? "All" : f === "active" ? "Active" : f === "payment_due" ? "Payment Due" : "On Hold"}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <div className={`h-px my-1 ${
                isDark ? "bg-slate-700" : "bg-gray-200"
              }`} />
              
              {clients.length === 0 ? (
                <div className="px-2 py-6 text-center">
                  <Building2 className={`w-8 h-8 mx-auto mb-2 ${
                    isDark ? "text-slate-500" : "text-gray-300"
                  }`} />
                  <p className={`text-sm mb-3 ${
                    isDark ? "text-slate-400" : "text-gray-500"
                  }`}>No clients yet</p>
                  <Button
                    onClick={handleCreateClient}
                    size="sm"
                    className="w-full bg-gray-950 hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-950 text-white transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Create First Client
                  </Button>
                </div>
              ) : (
                <div className="max-h-[360px] overflow-y-auto">
                  {!autoSelectFirst && (
                    <button
                      type="button"
                      onClick={handleClearClient}
                      className={cn(
                        "w-full px-3 py-2.5 rounded-lg text-left transition-all duration-200 focus:outline-none",
                        isDark
                          ? !selectedClient
                            ? "bg-slate-700/80 hover:bg-slate-700"
                            : "hover:bg-slate-700 focus:bg-slate-700"
                          : !selectedClient
                            ? "bg-gray-100 hover:bg-gray-100"
                            : "hover:bg-gray-50 focus:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-sm ${
                          isDark ? "text-slate-300" : "text-gray-700"
                        }`}>
                          No client — skip approval
                        </span>
                        {!selectedClient && (
                          <Check className={`w-4 h-4 flex-shrink-0 ml-2 ${
                            isDark ? "text-slate-300" : "text-gray-700"
                          }`} />
                        )}
                      </div>
                    </button>
                  )}
                  {filteredClients.length === 0 ? (
                    <div className={`px-3 py-8 text-center text-sm ${
                      isDark ? "text-slate-400" : "text-gray-500"
                    }`}>
                      No clients match your search.
                    </div>
                  ) : (
                  filteredClients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => handleClientSelect(client)}
                      className={cn(
                        "w-full px-3 py-2.5 rounded-lg text-left transition-all duration-200 focus:outline-none",
                        isDark
                          ? selectedClient?.id === client.id
                            ? "bg-slate-700/80 hover:bg-slate-700"
                            : "hover:bg-slate-700 focus:bg-slate-700"
                          : selectedClient?.id === client.id
                            ? "bg-gray-100 hover:bg-gray-100"
                            : "hover:bg-gray-50 focus:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <ClientAvatar
                            name={client.name}
                            logoUrl={client.logoUrl}
                            size="sm"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              isDark ? "text-slate-200" : "text-gray-900"
                            }`}>
                              {client.name}
                            </p>
                            <div className="mt-1">
                              {getStatusBadge(client)}
                            </div>
                          </div>
                        </div>
                        {selectedClient?.id === client.id && (
                          <Check className={`w-4 h-4 flex-shrink-0 ml-2 ${
                            isDark ? "text-slate-300" : "text-gray-700"
                          }`} />
                        )}
                      </div>
                    </button>
                  )))}
                  <div className={`h-px my-1 ${
                    isDark ? "bg-slate-700" : "bg-gray-200"
                  }`} />
                  <button
                    onClick={handleCreateClient}
                    className={`w-full px-3 py-2.5 rounded-lg text-left transition-all duration-200 focus:outline-none ${
                      isDark
                        ? "hover:bg-slate-700 focus:bg-slate-700 text-slate-300 hover:text-white"
                        : "hover:bg-gray-50 focus:bg-gray-50 text-gray-700 hover:text-gray-900"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium">Create New Client</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
