"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <h2 className="text-2xl font-bold mb-4 text-red-400">
              Application Error
            </h2>
            <p className="text-gray-300 mb-6">
              {error.message || "A critical error occurred"}
            </p>
            <button
              onClick={reset}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
            >
              Try again
            </button>
            {process.env.NODE_ENV === "development" && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-gray-400 mb-2">
                  Error Details
                </summary>
                <pre className="bg-gray-900 p-4 rounded text-xs overflow-auto text-gray-300">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}

