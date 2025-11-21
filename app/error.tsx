"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h2 className="text-2xl font-bold mb-4 text-red-400">
          Something went wrong!
        </h2>
        <p className="text-gray-300 mb-6">
          {error.message || "An unexpected error occurred"}
        </p>
        <div className="space-y-4">
          <Button
            onClick={reset}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
          >
            Try again
          </Button>
          <div>
            <a
              href="/"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Go back home
            </a>
          </div>
        </div>
        {process.env.NODE_ENV === "development" && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-gray-400 mb-2">
              Error Details (Development Only)
            </summary>
            <pre className="bg-gray-900 p-4 rounded text-xs overflow-auto text-gray-300">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

