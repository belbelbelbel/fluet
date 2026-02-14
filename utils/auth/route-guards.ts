import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserRoleData, getUserRoleFromClerk } from "./roles";

/**
 * Check if user has access to agency routes
 */
export async function requireAgencyAccess(): Promise<{ clerkUserId: string }> {
  let clerkUserId: string | null | undefined = null;
  
  try {
    const authResult = await auth();
    clerkUserId = authResult?.userId;
  } catch (error: any) {
    // If auth() fails due to expired token, try currentUser() as fallback
    if (error?.reason === 'token-expired' || error?.message?.includes('expired')) {
      try {
        const user = await currentUser();
        clerkUserId = user?.id ?? null;
      } catch (userError) {
        // Both failed, redirect to sign-in
        redirect("/sign-in");
      }
    } else {
      // Other auth errors, redirect to sign-in
      redirect("/sign-in");
    }
  }

  if (!clerkUserId) {
    redirect("/sign-in");
  }

  const role = await getUserRoleFromClerk(clerkUserId);
  
  if (role !== "agency") {
    // If user is client, redirect to their client dashboard
    const roleData = await getUserRoleData(clerkUserId);
    if (roleData?.role === "client" && roleData.clientId) {
      redirect(`/client/${roleData.clientId}/dashboard`);
    }
    redirect("/");
  }

  return { clerkUserId };
}

/**
 * Check if user has access to client routes
 */
export async function requireClientAccess(clientId?: number): Promise<{ 
  clerkUserId: string; 
  clientId: number;
}> {
  let clerkUserId: string | null | undefined = null;
  
  try {
    const authResult = await auth();
    clerkUserId = authResult?.userId;
  } catch (error: any) {
    // If auth() fails due to expired token, try currentUser() as fallback
    if (error?.reason === 'token-expired' || error?.message?.includes('expired')) {
      try {
        const user = await currentUser();
        clerkUserId = user?.id ?? null;
      } catch (userError) {
        // Both failed, redirect to sign-in
        redirect("/sign-in");
      }
    } else {
      // Other auth errors, redirect to sign-in
      redirect("/sign-in");
    }
  }

  if (!clerkUserId) {
    redirect("/sign-in");
  }

  const roleData = await getUserRoleData(clerkUserId);
  
  if (!roleData || roleData.role !== "client") {
    // If user is agency, redirect to agency dashboard
    if (roleData?.role === "agency") {
      redirect("/dashboard");
    }
    redirect("/");
  }

  // If clientId provided, verify it matches
  if (clientId && roleData.clientId !== clientId) {
    redirect("/");
  }

  if (!roleData.clientId) {
    redirect("/");
  }

  return { 
    clerkUserId, 
    clientId: roleData.clientId 
  };
}

/**
 * Check if user can access token-based approval portal
 */
export async function canAccessApprovalPortal(token: string): Promise<boolean> {
  // Token validation happens in API route
  // This is just for route access check
  return true; // Public route, validation in API
}
