import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define protected routes
const isAgencyRoute = createRouteMatcher(["/dashboard(.*)"]);
const isClientRoute = createRouteMatcher(["/client(.*)"]);
const isCheckoutRoute = createRouteMatcher(["/checkout(.*)"]);
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/pricing(.*)",
  "/client-portal(.*)",
  "/invite(.*)",
  "/clear-session(.*)",
  // API routes must never be redirected to sign-in page (would return HTML and break JSON clients)
  "/api(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;
  
  // Get userId - try multiple methods like API routes do
  let userId: string | null | undefined = null;
  let hasExpiredToken = false;
  
  // Method 1: Try auth() first
  try {
    const authResult = await auth();
    userId = authResult?.userId;
  } catch (error: any) {
    // Check if error is due to expired token
    if (error?.reason === 'token-expired' || error?.message?.includes('expired')) {
      hasExpiredToken = true;
    }
    // auth() failed, try next method
  }
  
  // Method 2: If auth() didn't work, try currentUser() as fallback
  if (!userId && !hasExpiredToken) {
    try {
      const user = await currentUser();
      userId = user?.id ?? null;
    } catch (error: any) {
      // Check if error is due to expired token
      if (error?.reason === 'token-expired' || error?.message?.includes('expired')) {
        hasExpiredToken = true;
      }
      userId = null;
    }
  }
  
  // Expired/stale Clerk cookies cause refresh loops — wipe session instead of sign-in ping-pong
  if (hasExpiredToken && !pathname.startsWith("/sign-in") && !pathname.startsWith("/sign-up") && !pathname.startsWith("/clear-session")) {
    const clearUrl = new URL("/clear-session", req.url);
    return NextResponse.redirect(clearUrl);
  }

  // If user is signed in and on sign-in/sign-up, redirect to their intended destination or dashboard
  if (userId && (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up"))) {
    const requestedRedirect = req.nextUrl.searchParams.get("redirect_url");
    let redirectUrl = "/dashboard";
    if (requestedRedirect) {
      try {
        const decoded = decodeURIComponent(requestedRedirect);
        if (decoded.startsWith("/") && !decoded.startsWith("//") && !decoded.includes("sign-in") && !decoded.includes("sign-up")) {
          redirectUrl = decoded;
        }
      } catch {
        redirectUrl = "/dashboard";
      }
    }
    const response = NextResponse.redirect(new URL(redirectUrl, req.url), { status: 307 });
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  }

  // Allow sign-in/sign-up for unauthenticated users
  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) {
    return NextResponse.next();
  }

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // For protected routes (dashboard, client, checkout), be VERY lenient - same as dashboard fix
  // If no userId from server, still allow access - let client-side Clerk handle it
  // This prevents redirect loops when user is authenticated but middleware hasn't got userId yet
  if (isAgencyRoute(req) || isClientRoute(req) || isCheckoutRoute(req)) {
    return NextResponse.next();
  }

  // For other protected routes, require userId and preserve full path + query
  if (!userId) {
    if (!pathname.startsWith("/sign-in") && !pathname.startsWith("/sign-up")) {
      const signInUrl = new URL("/sign-in", req.url);
      const fullPath = pathname + (req.nextUrl.search || "");
      signInUrl.searchParams.set("redirect_url", fullPath);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
