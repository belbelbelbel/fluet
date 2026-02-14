"use client";

import { useEffect } from "react";

/**
 * Global error handler to catch and ignore browser extension errors
 * that might cause blank pages
 */
export function GlobalErrorHandler() {
  useEffect(() => {
    // Handle unhandled promise rejections (often from browser extensions)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      
      // Check if error is from a browser extension
      if (
        error?.reqInfo?.pathPrefix === "/writing" ||
        error?.reqInfo?.path === "/get_template_list" ||
        error?.message?.includes("permission error") ||
        error?.error === "exceptions.UserAuthError" ||
        error?.code === 403 ||
        (error?.stack && error.stack.includes("background.js"))
      ) {
        // Ignore browser extension errors
        console.warn("[GlobalErrorHandler] Ignoring browser extension error:", error);
        event.preventDefault(); // Prevent default error handling
        return;
      }
      
      // Log other errors but don't prevent them
      console.error("[GlobalErrorHandler] Unhandled promise rejection:", error);
    };

    // Handle general errors
    const handleError = (event: ErrorEvent) => {
      const error = event.error;
      
      // Check if error is from a browser extension
      if (
        error?.reqInfo?.pathPrefix === "/writing" ||
        error?.reqInfo?.path === "/get_template_list" ||
        error?.message?.includes("permission error") ||
        error?.error === "exceptions.UserAuthError" ||
        error?.code === 403 ||
        (error?.stack && error.stack.includes("background.js"))
      ) {
        // Ignore browser extension errors
        console.warn("[GlobalErrorHandler] Ignoring browser extension error:", error);
        event.preventDefault(); // Prevent default error handling
        return;
      }
      
      // Log other errors but don't prevent them
      console.error("[GlobalErrorHandler] Error:", error);
    };

    // Add event listeners
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    // Cleanup
    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleError);
    };
  }, []);

  return null; // This component doesn't render anything
}
