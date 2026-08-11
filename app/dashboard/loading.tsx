"use client";

import { LoadingScreen } from "@/components/LoadingScreen";

export default function DashboardLoading() {
  return (
    <LoadingScreen
      variant="inline"
      message="Loading..."
      subtitle="Please wait a moment"
    />
  );
}
