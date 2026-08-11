"use client";

import { LoadingScreen } from "@/components/LoadingScreen";

export default function ClientDetailLoading() {
  return (
    <LoadingScreen
      variant="inline"
      message="Loading client..."
      subtitle="Fetching client data"
    />
  );
}
