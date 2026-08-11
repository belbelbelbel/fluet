"use client";

import { LoadingScreen } from "@/components/LoadingScreen";

export default function ClientsLoading() {
  return (
    <LoadingScreen
      variant="inline"
      message="Loading clients..."
      subtitle="Fetching your accounts"
    />
  );
}
