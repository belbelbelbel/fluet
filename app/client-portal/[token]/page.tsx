"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  Loader2,
  AlertCircle,
  Calendar,
  ArrowRight,
  Twitter,
  Instagram,
  Linkedin,
  Music2,
  Youtube,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";

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

function PlatformIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  const cls = "w-4 h-4";
  if (p.includes("twitter") || p === "x") return <Twitter className={cls} />;
  if (p.includes("instagram")) return <Instagram className={cls} />;
  if (p.includes("linkedin")) return <Linkedin className={cls} />;
  if (p.includes("tiktok")) return <Music2 className={cls} />;
  if (p.includes("youtube")) return <Youtube className={cls} />;
  return <Calendar className={cls} />;
}

export default function ClientApprovalPage() {
  const params = useParams();
  const token = params?.token as string;

  const [approval, setApproval] = useState<Approval | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [clientName, setClientName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [comment, setComment] = useState("");
  const [action, setAction] = useState<"approve" | "request_changes" | "reject" | null>(null);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);

  // Identity verification — a link holder must prove control of the client's
  // email before any decision is accepted.
  const [verified, setVerified] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchApproval = async () => {
      try {
        setLoading(true);
        setError(null);
        // no-store: a previously cached 410 must never be replayed here
        const response = await fetch(`/api/approvals/${token}`, {
          credentials: "include",
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          setApproval(data.approval);
          setPost(data.post);
          setClientName(data.client?.name || "");
          setVerified(!!data.verified);
        } else {
          setError(
            data.error ||
              (response.status === 410
                ? "This approval link has expired."
                : "This approval link is invalid.")
          );
        }
      } catch {
        setError("Couldn’t load this approval. Try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchApproval();
  }, [token]);

  const sendCode = async () => {
    if (!verifyEmail.trim()) return;
    try {
      setVerifyBusy(true);
      setVerifyError(null);
      const res = await fetch(`/api/approvals/${token}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: verifyEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCodeSentTo(data.sentTo || verifyEmail.trim());
      } else {
        setVerifyError(data.error || "Couldn't send the code.");
      }
    } catch {
      setVerifyError("Something went wrong. Try again.");
    } finally {
      setVerifyBusy(false);
    }
  };

  const confirmCode = async () => {
    if (verifyCode.trim().length !== 6) return;
    try {
      setVerifyBusy(true);
      setVerifyError(null);
      const res = await fetch(`/api/approvals/${token}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: verifyEmail.trim(), code: verifyCode.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setVerified(true);
        setVerifyCode("");
      } else {
        setVerifyError(data.error || "That code isn't right.");
        if (data.reason === "expired" || data.reason === "too_many_attempts") {
          setCodeSentTo(null);
        }
      }
    } catch {
      setVerifyError("Something went wrong. Try again.");
    } finally {
      setVerifyBusy(false);
    }
  };

  const handleSubmit = async () => {
    if (!action || !verified) return;

    try {
      setSubmitting(true);
      setDoneMessage(null);
      const response = await fetch(`/api/approvals/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action,
          comment: comment.trim() || undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setApproval(data.approval);
        setDoneMessage(
          action === "approve"
            ? "Approved — your agency has been notified."
            : action === "request_changes"
              ? "Changes requested — your agency has been notified."
              : "Rejected — your agency has been notified."
        );
      } else {
        setDoneMessage(data.error || "Couldn’t submit. Try again.");
      }
    } catch {
      setDoneMessage("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0b1220]">
        <PortalAtmosphere />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Logo size="lg" variant="full" forceDark className="opacity-90" />
          <Loader2 className="w-6 h-6 text-teal-300/80 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !approval || !post) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden bg-[#0b1220]">
        <PortalAtmosphere />
        <div
          className={cn(
            "relative z-10 max-w-md w-full text-center space-y-5 transition-all duration-700",
            entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          )}
        >
          <Logo size="md" variant="full" forceDark className="mx-auto" />
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl px-8 py-10">
            <AlertCircle className="w-9 h-9 text-teal-300/90 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Can’t open this approval
            </h1>
            <p className="mt-2 text-sm text-slate-300/90 leading-relaxed">
              {error || "This approval link is invalid or has expired."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isExpired = approval.expiresAt && new Date(approval.expiresAt) < new Date();
  const isProcessed = approval.status !== "pending" || !!doneMessage;
  const statusTone =
    approval.status === "approved" || doneMessage?.startsWith("Approved")
      ? "ok"
      : approval.status === "rejected" || doneMessage?.startsWith("Rejected") || isExpired
        ? "bad"
        : "warn";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b1220] text-white">
      <PortalAtmosphere />

      <header className="relative z-20">
        <div className="max-w-xl mx-auto px-5 h-16 flex items-center justify-between">
          <Logo size="sm" variant="full" forceDark />
          {clientName ? (
            <span className="text-xs sm:text-sm text-slate-300/80 truncate max-w-[48%] tracking-wide">
              {clientName}
            </span>
          ) : null}
        </div>
      </header>

      <main
        className={cn(
          "relative z-10 max-w-xl mx-auto px-5 pb-16 pt-6 sm:pt-10 transition-all duration-700 ease-out",
          entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        <div className="mb-8 sm:mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-300/80 mb-3">
            Review
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white leading-[1.15]">
            Does this look ready?
          </h1>
          <p className="mt-3 text-slate-300/90 text-sm sm:text-[15px] leading-relaxed max-w-md">
            Approve it, ask for edits, or reject it. Your agency is notified right away.
          </p>
        </div>

        {(isExpired || isProcessed || doneMessage) && (
          <div
            className={cn(
              "mb-6 rounded-2xl border px-4 py-3.5 text-sm backdrop-blur-md",
              statusTone === "ok" &&
                "border-emerald-400/25 bg-emerald-400/10 text-emerald-100",
              statusTone === "bad" && "border-rose-400/25 bg-rose-400/10 text-rose-100",
              statusTone === "warn" && "border-amber-400/25 bg-amber-400/10 text-amber-50"
            )}
          >
            {doneMessage ||
              (isExpired
                ? "This approval link has expired."
                : approval.status === "approved"
                  ? "This post has been approved."
                  : approval.status === "changes_requested"
                    ? "Changes were requested for this post."
                    : approval.status === "rejected"
                      ? "This post was rejected."
                      : null)}
          </div>
        )}

        {/* Post preview — phone chrome as visual anchor */}
        <article className="rounded-[1.75rem] border border-white/10 bg-gradient-to-b from-white/[0.09] to-white/[0.03] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-xl">
          <div className="px-5 sm:px-6 py-4 flex items-center justify-between gap-3 border-b border-white/8">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-200">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-400/15 text-teal-200">
                <PlatformIcon platform={post.platform} />
              </span>
              {post.platform}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(post.scheduledFor).toLocaleString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="px-5 sm:px-6 py-7 sm:py-8">
            <p className="text-[15px] sm:text-base text-slate-50 whitespace-pre-wrap leading-[1.7]">
              {post.content}
            </p>
          </div>
        </article>

        {!isProcessed && !isExpired && !verified && (
          <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 sm:p-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-400/15 text-teal-300">
                <ShieldCheck className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-100">Confirm it&apos;s you</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  {codeSentTo
                    ? `We sent a 6-digit code to ${codeSentTo}. It expires in 10 minutes.`
                    : `Only ${clientName || "the client"}'s email on file can sign off on this post.`}
                </p>
              </div>
            </div>

            {!codeSentTo ? (
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <input
                  type="email"
                  value={verifyEmail}
                  onChange={(e) => setVerifyEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendCode()}
                  placeholder="you@company.com"
                  autoComplete="email"
                  className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/25 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-teal-400/40"
                />
                <Button
                  type="button"
                  onClick={sendCode}
                  disabled={!verifyEmail.trim() || verifyBusy}
                  className="h-12 shrink-0 rounded-2xl bg-teal-400 px-5 font-semibold text-[#0b1220] transition-transform hover:bg-teal-300 active:scale-[0.99] disabled:opacity-40"
                >
                  {verifyBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send code"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && confirmCode()}
                    placeholder="000000"
                    className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/25 px-3.5 py-3 text-center font-mono text-lg tracking-[0.5em] text-white outline-none transition placeholder:text-slate-600 focus:ring-2 focus:ring-teal-400/40"
                  />
                  <Button
                    type="button"
                    onClick={confirmCode}
                    disabled={verifyCode.length !== 6 || verifyBusy}
                    className="h-12 shrink-0 rounded-2xl bg-teal-400 px-5 font-semibold text-[#0b1220] transition-transform hover:bg-teal-300 active:scale-[0.99] disabled:opacity-40"
                  >
                    {verifyBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCodeSentTo(null);
                    setVerifyCode("");
                    setVerifyError(null);
                  }}
                  className="text-xs text-slate-400 underline underline-offset-4 transition hover:text-slate-200"
                >
                  Use a different email or resend
                </button>
              </div>
            )}

            {verifyError && (
              <p className="text-xs leading-relaxed text-rose-300">{verifyError}</p>
            )}
          </div>
        )}

        {!isProcessed && !isExpired && verified && (
          <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-100">Your decision</p>
              <span className="inline-flex items-center gap-1.5 text-xs text-teal-300/90">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <DecisionButton
                active={action === "approve"}
                tone="approve"
                onClick={() => setAction("approve")}
                icon={CheckCircle2}
                label="Approve"
              />
              <DecisionButton
                active={action === "request_changes"}
                tone="edit"
                onClick={() => setAction("request_changes")}
                icon={MessageSquare}
                label="Request edits"
              />
              <DecisionButton
                active={action === "reject"}
                tone="reject"
                onClick={() => setAction("reject")}
                icon={XCircle}
                label="Reject"
              />
            </div>

            {(action === "request_changes" || action === "reject") && (
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-3 border border-white/10 rounded-2xl text-sm bg-black/25 text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-teal-400/40 resize-none transition"
                placeholder={
                  action === "request_changes"
                    ? "What should change?"
                    : "Why are you rejecting this?"
                }
              />
            )}

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!action || submitting}
              className="w-full rounded-2xl h-12 bg-teal-400 text-[#0b1220] font-semibold hover:bg-teal-300 disabled:opacity-40 transition-transform active:scale-[0.99]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending…
                </>
              ) : (
                "Confirm decision"
              )}
            </Button>
          </div>
        )}

        {isProcessed && !isExpired && (
          <p className="mt-10 text-center text-sm text-slate-400">
            Want the full calendar?{" "}
            <Link
              href="/sign-in"
              className="font-medium text-teal-300 hover:text-teal-200 underline underline-offset-4 decoration-teal-400/40"
            >
              Sign in
              <ArrowRight className="w-3.5 h-3.5 inline ml-0.5" />
            </Link>
          </p>
        )}

        <p className="mt-12 text-center text-[11px] tracking-wide text-slate-500">
          Powered by Revvy
        </p>
      </main>
    </div>
  );
}

function PortalAtmosphere() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(45,212,191,0.16),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(56,189,248,0.10),_transparent_50%),linear-gradient(180deg,#0b1220_0%,#111827_100%)]" />
      <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl animate-pulse" />
      <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}

function DecisionButton({
  active,
  tone,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  tone: "approve" | "edit" | "reject";
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 rounded-2xl border text-sm font-medium inline-flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]",
        tone === "approve" &&
          (active
            ? "border-teal-300/50 bg-teal-400 text-[#0b1220] shadow-[0_0_0_1px_rgba(45,212,191,0.35)]"
            : "border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]"),
        tone === "edit" &&
          (active
            ? "border-amber-300/40 bg-amber-400/20 text-amber-50"
            : "border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]"),
        tone === "reject" &&
          (active
            ? "border-rose-300/40 bg-rose-400/20 text-rose-50"
            : "border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]")
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
