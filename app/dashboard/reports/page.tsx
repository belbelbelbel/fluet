"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  Calendar,
  Loader2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { showToast } from "@/lib/toast";

interface ReportData {
  postsScheduled: number;
  postsPublished: number;
  contentGenerated: number;
  tasksCompleted: number;
  tasksTotal: number;
}

interface Report {
  id: number;
  clientId: number;
  clientName: string;
  periodStart: string;
  periodEnd: string;
  reportData?: ReportData;
  createdAt: string;
  pdfUrl?: string;
  sentToClient: boolean;
}

export default function ReportsPage() {
  const { userId } = useAuth();

  const [reports, setReports] = useState<Report[]>([]);
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  const fetchReports = useCallback(async () => {
    if (!userId) return;
    try {
      const url = `/api/reports?userId=${encodeURIComponent(userId)}${selectedClientId ? `&clientId=${selectedClientId}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      } else {
        setReports([]);
      }
    } catch {
      setReports([]);
    }
  }, [userId, selectedClientId]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const clientsRes = await fetch(`/api/clients?userId=${userId}`, {
          credentials: "include",
        });
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          setClients(clientsData.clients || []);
        }
        await fetchReports();
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, fetchReports]);

  useEffect(() => {
    if (!userId || loading) return;
    fetchReports();
  }, [selectedClientId, userId, loading, fetchReports]);

  const handleGenerateReport = async () => {
    if (!selectedClientId) {
      showToast.error("Select Client", "Please select a client first");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          userId,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create report");
      }
      const data = await res.json();
      setReports((prev) => [data.report, ...prev]);
      showToast.success("Report generated", `${data.report.clientName} – last 30 days`);
    } catch (e) {
      showToast.error("Error", e instanceof Error ? e.message : "Could not generate report");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReport = (report: Report) => {
    if (report.pdfUrl) {
      window.open(report.pdfUrl, "_blank");
    } else {
      const data = report.reportData;
      const text = data
        ? [
            `${report.clientName} – ${report.periodStart} to ${report.periodEnd}`,
            "",
            "Summary",
            `Posts scheduled: ${data.postsScheduled}`,
            `Posts published: ${data.postsPublished}`,
            `Content generated: ${data.contentGenerated}`,
            `Tasks completed: ${data.tasksCompleted} / ${data.tasksTotal}`,
          ].join("\n")
        : "No data";
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${report.clientName.replace(/\s+/g, "-")}-${report.periodStart}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      showToast.success("Downloaded", "Report saved as text file");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-foreground animate-spin mx-auto mb-4" />
          <p className={`text-sm text-muted-foreground`}>
            Loading reports...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - stacks on mobile */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className={`text-2xl sm:text-3xl font-bold text-foreground`}
          >
            Reports
          </h1>
          <p
            className={`mt-1 text-sm text-muted-foreground`}
          >
            Exportable reports and client-facing summaries
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 w-full sm:w-auto">
          <select
            value={selectedClientId || ""}
            onChange={(e) =>
              setSelectedClientId(
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            className={`w-full sm:w-auto min-w-0 px-4 py-2.5 sm:py-2 rounded-lg border text-sm ${
              "bg-white border-gray-300 text-gray-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
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
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 sm:py-2 min-h-[44px] touch-manipulation"
            disabled={!selectedClientId || generating}
          >
            {generating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            {generating ? "Generating…" : "Generate Report"}
          </Button>
        </div>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <Card
          className={`bg-card border-border`}
        >
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <FileText
                className={`w-16 h-16 mx-auto mb-4 ${
                  "text-gray-400 dark:text-slate-600"
                }`}
              />
              <h2
                className={`text-xl font-semibold mb-2 text-foreground`}
              >
                No reports yet
              </h2>
              <p
                className={`mb-6 text-muted-foreground`}
              >
                Generate your first report to get started
              </p>
              <Button
                onClick={handleGenerateReport}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={!selectedClientId}
              >
                <Plus className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {reports.map((report) => (
            <Card
              key={report.id}
              className={`bg-card border-border min-w-0`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle
                      className={`text-lg text-foreground`}
                    >
                      {report.clientName}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar
                        className={`w-4 h-4 text-muted-foreground`}
                      />
                      <span
                        className={`text-xs text-muted-foreground`}
                      >
                        {new Date(report.periodStart).toLocaleDateString()} -{" "}
                        {new Date(report.periodEnd).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {report.sentToClient && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
                      }`}
                    >
                      Sent
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {report.reportData && (
                  <div className={`grid grid-cols-2 gap-x-3 gap-y-1.5 mb-3 text-xs text-muted-foreground`}>
                    <span>Scheduled: {report.reportData.postsScheduled}</span>
                    <span>Published: {report.reportData.postsPublished}</span>
                    <span>Content: {report.reportData.contentGenerated}</span>
                    <span>Tasks: {report.reportData.tasksCompleted}/{report.reportData.tasksTotal}</span>
                  </div>
                )}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span
                    className={`text-xs text-muted-foreground/70`}
                  >
                    Created: {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                  <Button
                    onClick={() => handleDownloadReport(report)}
                    variant="outline"
                    size="sm"
                    className={`w-full sm:w-auto min-h-[40px] touch-manipulation ${
                      "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    {report.pdfUrl ? "Download PDF" : "Download"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card
        className={`bg-card border-border`}
      >
        <CardHeader>
          <CardTitle
            className={`flex items-center gap-2 text-foreground`}
          >
            <AlertCircle className="w-5 h-5 text-foreground" />
            About Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p
            className={`text-sm text-muted-foreground`}
          >
            Reports provide exportable summaries of your client&apos;s performance.
            Generate monthly reports to share with clients, track progress, and
            analyze trends over time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
