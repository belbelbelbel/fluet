"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/LoadingScreen";
import { authPath } from "@/lib/auth-redirect";
import { Users, CheckCircle2, AlertCircle, Mail } from "lucide-react";

interface InvitePreview {
  id: number;
  email: string;
  role: string;
  status: string;
  expiresAt?: string;
  inviterName: string;
}

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params?.token === "string" ? params.token : "";
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();

  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/team/invitations/by-token/${encodeURIComponent(token)}`, {
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || "Invitation not found");
          setInvite(null);
        } else {
          setInvite(data.invitation);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Could not load this invitation");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch(`/api/team/invitations/by-token/${encodeURIComponent(token)}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not accept invitation");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push(data.redirectTo || "/dashboard/team"), 1200);
    } catch {
      setError("Network error — try again");
    } finally {
      setAccepting(false);
    }
  };

  if (!authLoaded || !userLoaded || loading) {
    return (
      <LoadingScreen
        variant="fullscreen"
        message="Loading invitation..."
        subtitle="Just a moment"
      />
    );
  }

  const returnPath = `/invite/${token}`;
  const signedInEmail =
    user?.primaryEmailAddress?.emailAddress?.toLowerCase().trim() || "";
  const inviteEmail = invite?.email?.toLowerCase().trim() || "";
  const emailMismatch =
    isSignedIn && invite && signedInEmail && inviteEmail && signedInEmail !== inviteEmail;
  const canAccept =
    isSignedIn &&
    invite &&
    invite.status === "pending" &&
    !emailMismatch &&
    !success;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 via-white to-purple-50/40 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Revvy team invite
            </p>
            <h1 className="text-xl font-bold text-gray-950">Join the team</h1>
          </div>
        </div>

        {error && !invite && (
          <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {invite && (
          <div className="space-y-5">
            <div className="rounded-xl border border-gray-100 bg-slate-50 p-4 space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{invite.inviterName}</span>{" "}
                invited you to collaborate on Revvy.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{invite.email}</span>
              </div>
              <p className="text-xs text-gray-500 capitalize">
                Role: {invite.role} · Status: {invite.status}
                {invite.expiresAt
                  ? ` · Expires ${new Date(invite.expiresAt).toLocaleDateString()}`
                  : ""}
              </p>
            </div>

            {success && (
              <div className="flex gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <p>You&apos;re in — taking you to the team page…</p>
              </div>
            )}

            {error && invite && (
              <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {invite.status !== "pending" && !success && (
              <p className="text-sm text-gray-600">
                This invitation is no longer available ({invite.status}).
              </p>
            )}

            {emailMismatch && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
                You&apos;re signed in as <strong>{signedInEmail}</strong>, but this invite
                was sent to <strong>{invite.email}</strong>. Switch accounts to accept.
              </p>
            )}

            {!isSignedIn && invite.status === "pending" && (
              <div className="flex flex-col gap-2">
                <Button asChild className="w-full">
                  <Link href={authPath("sign-in", returnPath)}>Sign in to accept</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href={authPath("sign-up", returnPath)}>Create account & accept</Link>
                </Button>
              </div>
            )}

            {canAccept && (
              <Button
                className="w-full"
                onClick={handleAccept}
                disabled={accepting}
              >
                {accepting ? "Joining…" : "Accept invitation"}
              </Button>
            )}

            <p className="text-center text-xs text-gray-500">
              <Link href="/" className="underline underline-offset-2 hover:text-gray-800">
                Back to Revvy
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
