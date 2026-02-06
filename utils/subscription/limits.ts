/**
 * Professional Subscription & Usage Limits Manager
 * Implements quota management, grace periods, and usage analytics
 */

import { GetUserByClerkId, GetUserSubscription, GetUserUsageCount } from "@/utils/db/actions";
import { db } from "@/utils/db/dbConfig";
import { GeneratedContent } from "@/utils/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export interface PlanLimits {
  monthlyLimit: number;
  name: string;
  features: string[];
  gracePeriod: number; // Days of grace period after limit
}

export const PLAN_CONFIG: Record<string, PlanLimits> = {
  free: {
    monthlyLimit: 10,
    name: "Free",
    features: ["Basic content generation"],
    gracePeriod: 0,
  },
  starter: {
    monthlyLimit: 100,
    name: "Starter",
    features: ["100 posts/month", "All platforms", "Basic analytics"],
    gracePeriod: 3,
  },
  basic: {
    monthlyLimit: 100,
    name: "Basic",
    features: ["100 posts/month", "All platforms", "Basic analytics"],
    gracePeriod: 3,
  },
  professional: {
    monthlyLimit: 500,
    name: "Professional",
    features: ["500 posts/month", "All platforms", "Advanced analytics", "Priority support"],
    gracePeriod: 7,
  },
  pro: {
    monthlyLimit: 500,
    name: "Professional",
    features: ["500 posts/month", "All platforms", "Advanced analytics", "Priority support"],
    gracePeriod: 7,
  },
  enterprise: {
    monthlyLimit: Infinity,
    name: "Enterprise",
    features: ["Unlimited posts", "All platforms", "Enterprise analytics", "Dedicated support", "Custom AI models"],
    gracePeriod: 30,
  },
};

export interface UsageStatus {
  canGenerate: boolean;
  usageCount: number;
  limit: number;
  remaining: number;
  percentageUsed: number;
  daysUntilReset: number;
  isNearLimit: boolean;
  isInGracePeriod: boolean;
  gracePeriodDaysRemaining: number;
  planName: string;
  upgradeRecommended: boolean;
}

/**
 * Check if user can generate content based on subscription limits
 */
export async function checkUsageLimit(
  clerkUserId: string
): Promise<UsageStatus> {
  const user = await GetUserByClerkId(clerkUserId);
  
  if (!user) {
    throw new Error("User not found");
  }

  // Get subscription
  const subscription = await GetUserSubscription(user.id);
  const planName = subscription?.plan?.toLowerCase() || "free";
  const planConfig = PLAN_CONFIG[planName] || PLAN_CONFIG.free;
  
  // Check if subscription is active
  const isActive = subscription && !subscription.canceldate;
  const effectivePlan = isActive ? planName : "free";
  const effectiveConfig = PLAN_CONFIG[effectivePlan] || PLAN_CONFIG.free;

  // Get current month usage
  const usageCount = await GetUserUsageCount(user.id);
  const limit = effectiveConfig.monthlyLimit;

  // Calculate remaining quota
  const remaining = limit === Infinity ? Infinity : Math.max(0, limit - usageCount);
  const percentageUsed = limit === Infinity ? 0 : (usageCount / limit) * 100;

  // Calculate days until reset (first day of next month)
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysUntilReset = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Check if near limit (80% threshold)
  const isNearLimit = limit !== Infinity && percentageUsed >= 80;

  // Check grace period
  let isInGracePeriod = false;
  let gracePeriodDaysRemaining = 0;
  
  if (limit !== Infinity && usageCount >= limit && effectiveConfig.gracePeriod > 0) {
    // Check if we're in grace period
    const lastGeneration = await getLastGenerationDate(user.id);
    if (lastGeneration) {
      const daysSinceLastGeneration = Math.floor(
        (now.getTime() - lastGeneration.getTime()) / (1000 * 60 * 60 * 24)
      );
      isInGracePeriod = daysSinceLastGeneration <= effectiveConfig.gracePeriod;
      gracePeriodDaysRemaining = Math.max(0, effectiveConfig.gracePeriod - daysSinceLastGeneration);
    }
  }

  // Determine if generation is allowed
  const canGenerate = 
    limit === Infinity || 
    usageCount < limit || 
    isInGracePeriod;

  // Recommend upgrade if at 90%+ usage
  const upgradeRecommended = limit !== Infinity && percentageUsed >= 90;

  return {
    canGenerate,
    usageCount,
    limit,
    remaining,
    percentageUsed,
    daysUntilReset,
    isNearLimit,
    isInGracePeriod,
    gracePeriodDaysRemaining,
    planName: effectiveConfig.name,
    upgradeRecommended,
  };
}

/**
 * Get last generation date for grace period calculation
 */
async function getLastGenerationDate(userId: number): Promise<Date | null> {
  try {
    const [lastContent] = await db
      .select({ createdAt: GeneratedContent.createdAt })
      .from(GeneratedContent)
      .where(eq(GeneratedContent.userId, userId))
      .orderBy(sql`${GeneratedContent.createdAt} DESC`)
      .limit(1)
      .execute();

    return lastContent?.createdAt || null;
  } catch (error) {
    console.error("[Limits] Error getting last generation date:", error);
    return null;
  }
}

/**
 * Get usage analytics for dashboard
 */
export async function getUsageAnalytics(clerkUserId: string) {
  const user = await GetUserByClerkId(clerkUserId);
  if (!user) {
    throw new Error("User not found");
  }

  const status = await checkUsageLimit(clerkUserId);
  const subscription = await GetUserSubscription(user.id);

  // Get usage by platform
  const platformUsage = await getPlatformUsage(user.id);
  
  // Get usage trend (last 7 days)
  const trend = await getUsageTrend(user.id);

  return {
    ...status,
    subscription: subscription ? {
      plan: subscription.plan,
      startDate: subscription.startdate,
      endDate: subscription.enddate,
      isActive: !subscription.canceldate,
    } : null,
    platformUsage,
    trend,
  };
}

async function getPlatformUsage(userId: number) {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await db
      .select({
        platform: GeneratedContent.contentType,
        count: sql<number>`count(*)::int`,
      })
      .from(GeneratedContent)
      .where(
        and(
          eq(GeneratedContent.userId, userId),
          gte(GeneratedContent.createdAt, startOfMonth)
        )
      )
      .groupBy(GeneratedContent.contentType)
      .execute();

    return result.reduce((acc, row) => {
      acc[row.platform] = Number(row.count);
      return acc;
    }, {} as Record<string, number>);
  } catch (error) {
    console.error("[Limits] Error getting platform usage:", error);
    return {};
  }
}

async function getUsageTrend(userId: number) {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await db
      .select({
        date: sql<string>`DATE(${GeneratedContent.createdAt})`,
        count: sql<number>`count(*)::int`,
      })
      .from(GeneratedContent)
      .where(
        and(
          eq(GeneratedContent.userId, userId),
          gte(GeneratedContent.createdAt, sevenDaysAgo)
        )
      )
      .groupBy(sql`DATE(${GeneratedContent.createdAt})`)
      .execute();

    return result.map(row => ({
      date: row.date,
      count: Number(row.count),
    }));
  } catch (error) {
    console.error("[Limits] Error getting usage trend:", error);
    return [];
  }
}
