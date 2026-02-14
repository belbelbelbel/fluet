"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { showToast } from "@/lib/toast";

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
      <div className="flex items-center justify-between">
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
            Manage all your client accounts
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/clients/new")}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
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
      )}
    </div>
  );
}
