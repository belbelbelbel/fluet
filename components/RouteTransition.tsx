"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
// import { Loader2 } from "lucide-react";

export function RouteTransition() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    // Clear loading state quickly - Next.js navigation is fast
    const timer = setTimeout(() => setIsLoading(false), 50);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200">
      <div className="h-full bg-blue-600 animate-pulse" style={{ width: '30%' }} />
    </div>
  );
}
