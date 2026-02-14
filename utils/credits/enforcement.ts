import { db } from "@/utils/db/dbConfig";
import { ClientCredits } from "@/utils/db/schema";
import { eq } from "drizzle-orm";
import { GetClientById } from "@/utils/db/actions";

export interface CreditsStatus {
  postsUsed: number;
  postsPerMonth: number;
  percentageUsed: number;
  remaining: number;
  isNearLimit: boolean; // 80% threshold
  isExceeded: boolean; // 100% threshold
  canGenerate: boolean;
}

/**
 * Get client credits status
 */
export async function getClientCreditsStatus(
  clientId: number
): Promise<CreditsStatus> {
  try {
    const [credits] = await db
      .select()
      .from(ClientCredits)
      .where(eq(ClientCredits.clientId, clientId))
      .limit(1)
      .execute();

    if (!credits) {
      // Create default credits record
      await db.insert(ClientCredits).values({
        clientId,
        postsPerMonth: 12,
        postsUsed: 0,
      });

      return {
        postsUsed: 0,
        postsPerMonth: 12,
        percentageUsed: 0,
        remaining: 12,
        isNearLimit: false,
        isExceeded: false,
        canGenerate: true,
      };
    }

    const percentageUsed = (credits.postsUsed / credits.postsPerMonth) * 100;
    const remaining = credits.postsPerMonth - credits.postsUsed;
    const isNearLimit = percentageUsed >= 80;
    const isExceeded = credits.postsUsed >= credits.postsPerMonth;
    const canGenerate = !isExceeded;

    return {
      postsUsed: credits.postsUsed,
      postsPerMonth: credits.postsPerMonth,
      percentageUsed,
      remaining,
      isNearLimit,
      isExceeded,
      canGenerate,
    };
  } catch (error) {
    console.error("[getClientCreditsStatus] Error:", error);
    // Return safe defaults on error
    return {
      postsUsed: 0,
      postsPerMonth: 12,
      percentageUsed: 0,
      remaining: 12,
      isNearLimit: false,
      isExceeded: false,
      canGenerate: true,
    };
  }
}

/**
 * Check if client can generate content
 */
export async function canClientGenerate(clientId: number): Promise<{
  allowed: boolean;
  status: CreditsStatus;
  message?: string;
}> {
  const status = await getClientCreditsStatus(clientId);

  if (status.isExceeded) {
    return {
      allowed: false,
      status,
      message: `Credits exceeded (${status.postsUsed}/${status.postsPerMonth}). Upgrade your plan to continue generating content.`,
    };
  }

  return {
    allowed: true,
    status,
  };
}

/**
 * Increment client credits usage
 */
export async function incrementClientCredits(clientId: number): Promise<boolean> {
  try {
    const [credits] = await db
      .select()
      .from(ClientCredits)
      .where(eq(ClientCredits.clientId, clientId))
      .limit(1)
      .execute();

    if (!credits) {
      // Create and increment
      await db.insert(ClientCredits).values({
        clientId,
        postsPerMonth: 12,
        postsUsed: 1,
      });
      return true;
    }

    await db
      .update(ClientCredits)
      .set({
        postsUsed: credits.postsUsed + 1,
        updatedAt: new Date(),
      })
      .where(eq(ClientCredits.clientId, clientId))
      .execute();

    return true;
  } catch (error) {
    console.error("[incrementClientCredits] Error:", error);
    return false;
  }
}
