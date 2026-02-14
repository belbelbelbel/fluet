import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define protected routes
const isAgencyRoute = createRouteMatcher(["/dashboard(.*)"]);
const isClientRoute = createRouteMatcher(["/client(.*)"]);
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/pricing(.*)",
  "/client-portal(.*)",
  "/invite(.*)",
  "/clear-session(.*)",
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
  
  // If token is expired, redirect to sign-in to get fresh token
  if (hasExpiredToken && !pathname.startsWith("/sign-in") && !pathname.startsWith("/sign-up") && !pathname.startsWith("/clear-session")) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // CRITICAL: If user has userId and is on sign-in/sign-up, redirect to dashboard
  // This MUST happen before any other checks
  if (userId && (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up"))) {
    const redirectUrl = "/dashboard";
    const response = NextResponse.redirect(new URL(redirectUrl, req.url), { status: 307 });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
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

  // For protected routes (dashboard, client), be VERY lenient
  // If no userId from server, still allow access - let client-side Clerk handle it
  // This prevents redirect loops when session is expired but user is logged in client-side
  if (isAgencyRoute(req) || isClientRoute(req)) {
    // Allow access even if userId is null - client-side will handle auth
    return NextResponse.next();
  }

  // For other protected routes, require userId
  if (!userId) {
    if (!pathname.startsWith("/sign-in") && !pathname.startsWith("/sign-up")) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", pathname);
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
