"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { 
  ChevronDown, 
  Plus, 
  Building2, 
  Check,
  AlertCircle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Client {
  id: number;
  name: string;
  logoUrl?: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface ClientSelectorProps {
  selectedClientId?: number | null;
  onClientChange?: (clientId: number | null) => void;
}

export function ClientSelector({ selectedClientId, onClientChange }: ClientSelectorProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Fetch clients function - memoized
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/clients", {
        credentials: "include",
        next: { revalidate: 30 }, // Cache for 30 seconds
      });
      
      if (response.ok) {
        const data = await response.json();
        const fetchedClients = data.clients || [];
        setClients(fetchedClients);
        
        // Set selected client if ID is provided
        if (selectedClientId) {
          const client = fetchedClients.find((c: Client) => c.id === selectedClientId);
          if (client) {
            setSelectedClient(client);
          } else if (fetchedClients.length > 0) {
            // If selected client not found, select first one
            setSelectedClient(fetchedClients[0]);
            onClientChange?.(fetchedClients[0].id);
          }
        } else if (fetchedClients.length > 0 && !selectedClient) {
          // Auto-select first client if none selected
          setSelectedClient(fetchedClients[0]);
          onClientChange?.(fetchedClients[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedClientId, onClientChange]);

  // Fetch clients on mount and when selectedClientId changes
  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId]); // Removed onClientChange to prevent blinking

  // Listen for client creation events to refresh the list
  useEffect(() => {
    const handleClientCreated = () => {
      fetchClients();
    };

    window.addEventListener('clientCreated', handleClientCreated);
    return () => {
      window.removeEventListener('clientCreated', handleClientCreated);
    };
  }, []);

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setOpen(false);
    onClientChange?.(client.id);
    
    // Update URL if on client-specific page
    if (pathname.includes("/clients/")) {
      router.push(`/dashboard/clients/${client.id}`);
    }
  };

  const handleCreateClient = () => {
    setOpen(false);
    router.push("/dashboard/clients/new");
  };

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
          {selectedClient?.logoUrl ? (
            <img
              src={selectedClient.logoUrl}
              alt={selectedClient.name}
              className="w-5 h-5 rounded object-cover flex-shrink-0"
            />
          ) : (
            <Building2 className={`w-5 h-5 flex-shrink-0 ${
              isDark ? "text-slate-400" : "text-gray-400"
            }`} />
          )}
          <span className="truncate">
            {selectedClient ? selectedClient.name : "Select Client"}
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
          <div className={`absolute z-50 mt-2 w-[280px] rounded-lg border shadow-lg ${
            isDark 
              ? "bg-slate-800 border-slate-700 shadow-xl" 
              : "bg-white border-gray-200"
          }`}>
            <div className="p-2">
              <div className={`px-2 py-1.5 text-xs font-semibold uppercase tracking-wider ${
                isDark ? "text-slate-400" : "text-gray-500"
              }`}>
                Clients
              </div>
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
                    className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Create First Client
                  </Button>
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto">
                  {clients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => handleClientSelect(client)}
                      className={cn(
                        "w-full px-3 py-2.5 rounded-lg text-left transition-all duration-200 focus:outline-none",
                        isDark
                          ? selectedClient?.id === client.id
                            ? "bg-purple-900/50 hover:bg-purple-900/70"
                            : "hover:bg-slate-700 focus:bg-slate-700"
                          : selectedClient?.id === client.id
                            ? "bg-purple-50 hover:bg-purple-100"
                            : "hover:bg-gray-50 focus:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {client.logoUrl ? (
                            <img
                              src={client.logoUrl}
                              alt={client.name}
                              className="w-6 h-6 rounded object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                              isDark ? "bg-purple-900/50" : "bg-purple-100"
                            }`}>
                              <Building2 className={`w-4 h-4 ${
                                isDark ? "text-purple-400" : "text-purple-600"
                              }`} />
                            </div>
                          )}
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
                            isDark ? "text-purple-400" : "text-purple-600"
                          }`} />
                        )}
                      </div>
                    </button>
                  ))}
                  <div className={`h-px my-1 ${
                    isDark ? "bg-slate-700" : "bg-gray-200"
                  }`} />
                  <button
                    onClick={handleCreateClient}
                    className={`w-full px-3 py-2.5 rounded-lg text-left transition-all duration-200 focus:outline-none ${
                      isDark
                        ? "hover:bg-slate-700 focus:bg-slate-700"
                        : "hover:bg-gray-50 focus:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Plus className={`w-4 h-4 ${
                        isDark ? "text-purple-400" : "text-purple-600"
                      }`} />
                      <span className={`text-sm font-medium ${
                        isDark ? "text-purple-400" : "text-purple-600"
                      }`}>Create New Client</span>
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
