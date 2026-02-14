"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  Loader2,
  AlertCircle,
  Calendar,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Approval {
  id: number;
  scheduledPostId: number;
  clientId: number;
  status: string;
  clientComment?: string;
  expiresAt: string;
}

interface Post {
  id: number;
  platform: string;
  content: string;
  scheduledFor: string;
}

export default function ClientApprovalPage() {
  const params = useParams();
  const token = params?.token as string;

  const [approval, setApproval] = useState<Approval | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [comment, setComment] = useState("");
  const [action, setAction] = useState<"approve" | "request_changes" | "reject" | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchApproval = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/approvals/${token}`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setApproval(data.approval);
          setPost(data.post);
        } else {
          const error = await response.json();
          console.error("Failed to fetch approval:", error);
        }
      } catch (error) {
        console.error("Error fetching approval:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApproval();
  }, [token]);

  const handleSubmit = async () => {
    if (!action) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/approvals/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action,
          comment: comment.trim() || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setApproval(data.approval);
        // Show success message
        alert(data.message);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to submit approval");
      }
    } catch (error) {
      console.error("Error submitting approval:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "twitter":
        return "🐦";
      case "instagram":
        return "📷";
      case "linkedin":
        return "💼";
      case "youtube":
        return "▶️";
      case "tiktok":
        return "🎵";
      default:
        return <Globe className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!approval || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-gray-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Approval Not Found
              </h2>
              <p className="text-gray-600">
                This approval link is invalid or has expired.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = approval.expiresAt && new Date(approval.expiresAt) < new Date();
  const isProcessed = approval.status !== "pending";

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Post Approval
          </h1>
          <p className="text-gray-600">
            Review and approve the scheduled post below
          </p>
        </div>

        {isExpired && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">This approval link has expired.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {isProcessed && (
          <Card className="mb-6 border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                {approval.status === "approved" && (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <p className="font-medium text-green-700">
                      This post has been approved.
                    </p>
                  </>
                )}
                {approval.status === "changes_requested" && (
                  <>
                    <MessageSquare className="w-5 h-5 text-yellow-600" />
                    <p className="font-medium text-yellow-700">
                      Changes have been requested for this post.
                    </p>
                  </>
                )}
                {approval.status === "rejected" && (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    <p className="font-medium text-red-700">
                      This post has been rejected.
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-gray-200 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Post Details</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getPlatformIcon(post.platform)}</span>
                <span className="text-sm font-medium text-gray-600 capitalize">
                  {post.platform}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Scheduled For
              </label>
              <div className="flex items-center gap-2 text-gray-900">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>
                  {new Date(post.scheduledFor).toLocaleString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Content
              </label>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {!isProcessed && !isExpired && (
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Your Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => setAction("approve")}
                  className={cn(
                    "flex-1 bg-green-600 hover:bg-green-700 text-white",
                    action === "approve" && "ring-2 ring-green-500 ring-offset-2"
                  )}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => setAction("request_changes")}
                  variant="outline"
                  className={cn(
                    "flex-1 border-yellow-300 text-yellow-700 hover:bg-yellow-50",
                    action === "request_changes" && "ring-2 ring-yellow-500 ring-offset-2 bg-yellow-50"
                  )}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Request Changes
                </Button>
                <Button
                  onClick={() => setAction("reject")}
                  variant="outline"
                  className={cn(
                    "flex-1 border-red-300 text-red-700 hover:bg-red-50",
                    action === "reject" && "ring-2 ring-red-500 ring-offset-2 bg-red-50"
                  )}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>

              {(action === "request_changes" || action === "reject") && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Comment {action === "request_changes" ? "(Optional)" : ""}
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
                    placeholder={
                      action === "request_changes"
                        ? "What changes would you like to see?"
                        : "Why are you rejecting this post?"
                    }
                  />
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={!action || submitting}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Decision"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {isProcessed && (
          <Card className="border-purple-200 bg-purple-50/50 mt-6">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-700 mb-3">
                Create an account to view all your scheduled posts and approvals in one place.
              </p>
              <Link
                href="/sign-up"
                className="inline-flex items-center text-sm font-medium text-purple-700 hover:text-purple-800"
              >
                Sign up for full dashboard access →
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
