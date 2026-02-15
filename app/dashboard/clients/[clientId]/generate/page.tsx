"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * Client-scoped generate: redirect to main Generate page with clientId so
 * the user gets the full generate UI and content is associated with the client.
 */
export default function ClientGeneratePage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params?.clientId as string | undefined;

  useEffect(() => {
    if (clientId) {
      router.replace(`/dashboard/generate?clientId=${encodeURIComponent(clientId)}`);
    } else {
      router.replace("/dashboard/generate");
    }
  }, [clientId, router]);

  return (
    <div className="min-h-[200px] flex items-center justify-center">
      <p className="text-gray-500">Redirecting to Generate...</p>
    </div>
  );
}
