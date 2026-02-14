"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  Calendar,
  Building2,
  Loader2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { showToast } from "@/lib/toast";

interface Report {
  id: number;
  clientId: number;
  clientName: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  pdfUrl?: string;
  sentToClient: boolean;
}

export default function ReportsPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [reports, setReports] = useState<Report[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch clients
        const clientsResponse = await fetch(`/api/clients?userId=${userId}`, {
          credentials: "include",
        });

        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json();
          setClients(clientsData.clients || []);
        }

        // TODO: Fetch reports from API
        // For now, use empty array
        setReports([]);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        // Silent fail - don't show unnecessary toast
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleGenerateReport = () => {
    if (!selectedClientId) {
      showToast.error("Select Client", "Please select a client first");
      return;
    }
    // TODO: Implement report generation
    showToast.info("Coming Soon", "Report generation will be available soon");
  };

  const handleDownloadReport = (report: Report) => {
    if (report.pdfUrl) {
      window.open(report.pdfUrl, "_blank");
    } else {
      showToast.error("No PDF", "PDF not available for this report");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-4" />
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}>
            Loading reports...
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
            Reports
          </h1>
          <p
            className={`mt-1 text-sm ${
              isDark ? "text-slate-400" : "text-gray-600"
            }`}
          >
            Exportable reports and client-facing summaries
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedClientId || ""}
            onChange={(e) =>
              setSelectedClientId(
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            className={`px-4 py-2 rounded-lg border text-sm ${
              isDark
                ? "bg-slate-800 border-slate-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          >
            <option value="">All Clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <Button
            onClick={handleGenerateReport}
            className="bg-purple-600 hover:bg-purple-700 text-white"
            disabled={!selectedClientId}
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <Card
          className={`${
            isDark
              ? "bg-slate-800 border-slate-700"
              : "bg-white border-gray-200"
          }`}
        >
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <FileText
                className={`w-16 h-16 mx-auto mb-4 ${
                  isDark ? "text-slate-600" : "text-gray-400"
                }`}
              />
              <h2
                className={`text-xl font-semibold mb-2 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                No reports yet
              </h2>
              <p
                className={`mb-6 ${
                  isDark ? "text-slate-400" : "text-gray-600"
                }`}
              >
                Generate your first report to get started
              </p>
              <Button
                onClick={handleGenerateReport}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={!selectedClientId}
              >
                <Plus className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <Card
              key={report.id}
              className={`${
                isDark
                  ? "bg-slate-800 border-slate-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle
                      className={`text-lg ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {report.clientName}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar
                        className={`w-4 h-4 ${
                          isDark ? "text-slate-400" : "text-gray-500"
                        }`}
                      />
                      <span
                        className={`text-xs ${
                          isDark ? "text-slate-400" : "text-gray-500"
                        }`}
                      >
                        {new Date(report.periodStart).toLocaleDateString()} -{" "}
                        {new Date(report.periodEnd).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {report.sentToClient && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        isDark
                          ? "bg-green-950/50 text-green-400"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      Sent
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs ${
                      isDark ? "text-slate-500" : "text-gray-400"
                    }`}
                  >
                    Created: {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                  <Button
                    onClick={() => handleDownloadReport(report)}
                    variant="outline"
                    size="sm"
                    className={`${
                      isDark
                        ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card
        className={`${
          isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
        }`}
      >
        <CardHeader>
          <CardTitle
            className={`flex items-center gap-2 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            <AlertCircle className="w-5 h-5 text-purple-600" />
            About Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p
            className={`text-sm ${
              isDark ? "text-slate-400" : "text-gray-600"
            }`}
          >
            Reports provide exportable summaries of your client's performance.
            Generate monthly reports to share with clients, track progress, and
            analyze trends over time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
