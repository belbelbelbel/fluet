import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/utils/db/dbConfig";
import { UserAccounts } from "@/utils/db/schema";
import { eq } from "drizzle-orm";

export type UserRole = "agency" | "client";

export interface UserRoleData {
  role: UserRole;
  clientId?: number;
  agencyId?: number;
  clientIds?: number[]; // For multi-client access
}

/**
 * Get user role from Clerk metadata (fast, for middleware)
 */
export async function getUserRoleFromClerk(clerkUserId: string): Promise<UserRole | null> {
  try {
    const user = await currentUser();
    if (!user || user.id !== clerkUserId) return null;
    
    const role = user.publicMetadata?.role as UserRole | undefined;
    return role === "agency" || role === "client" ? role : null;
  } catch {
    return null;
  }
}

/**
 * Get user role data from database (source of truth)
 */
export async function getUserRoleData(clerkUserId: string): Promise<UserRoleData | null> {
  try {
    const [account] = await db
      .select()
      .from(UserAccounts)
      .where(eq(UserAccounts.clerkUserId, clerkUserId))
      .limit(1)
      .execute();

    if (!account) return null;

    return {
      role: account.role as UserRole,
      clientId: account.clientId || undefined,
      agencyId: account.agencyId || undefined,
    };
  } catch (error) {
    console.error("[getUserRoleData] Error:", error);
    return null;
  }
}

/**
 * Set user role in Clerk metadata
 */
export async function setClerkRole(clerkUserId: string, role: UserRole): Promise<boolean> {
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = clerkClient();
    
    await client.users.updateUser(clerkUserId, {
      publicMetadata: {
        role,
      },
    });
    
    return true;
  } catch (error) {
    console.error("[setClerkRole] Error:", error);
    return false;
  }
}

/**
 * Create or update user account in database
 */
export async function createOrUpdateUserAccount(
  clerkUserId: string,
  role: UserRole,
  clientId?: number,
  agencyId?: number
): Promise<boolean> {
  try {
    const existing = await db
      .select()
      .from(UserAccounts)
      .where(eq(UserAccounts.clerkUserId, clerkUserId))
      .limit(1)
      .execute();

    if (existing.length > 0) {
      await db
        .update(UserAccounts)
        .set({
          role,
          clientId: clientId || null,
          agencyId: agencyId || null,
          updatedAt: new Date(),
        })
        .where(eq(UserAccounts.clerkUserId, clerkUserId))
        .execute();
    } else {
      await db.insert(UserAccounts).values({
        clerkUserId,
        role,
        clientId: clientId || null,
        agencyId: agencyId || null,
      });
    }

    return true;
  } catch (error) {
    console.error("[createOrUpdateUserAccount] Error:", error);
    return false;
  }
}
