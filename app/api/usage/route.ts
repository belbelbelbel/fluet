import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { GetUserByClerkId, GetUserSubscription, GetUserUsageCount } from "@/utils/db/actions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get authentication
    const authResult = await auth();
    let clerkUserId: string | null | undefined = authResult?.userId || null;
    
    if (!clerkUserId) {
      try {
        const user = await currentUser();
        clerkUserId = user?.id ?? null;
      } catch (error) {
        console.warn("currentUser() failed:", error);
      }
    }

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await GetUserByClerkId(clerkUserId);
    if (!user || !user.id) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get subscription and usage info
    const subscription = await GetUserSubscription(user.id);
    const usageCount = await GetUserUsageCount(user.id);

    // Determine monthly limit based on subscription
    let monthlyLimit: number = 10; // Default free tier
    let planName = "Free";
    
    if (subscription && !subscription.canceldate) {
      planName = subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1);
      switch (subscription.plan.toLowerCase()) {
        case "basic":
        case "starter":
          monthlyLimit = 100;
          break;
        case "pro":
        case "professional":
          monthlyLimit = 500;
          break;
        case "enterprise":
          monthlyLimit = Infinity;
          break;
        default:
          monthlyLimit = 10;
      }
    }

    // Calculate days until reset (first day of next month)
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const daysUntilReset = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate usage percentage
    const usagePercentage = monthlyLimit === Infinity 
      ? 0 
      : Math.min(100, (usageCount / monthlyLimit) * 100);

    // Determine status
    const isAtLimit = monthlyLimit !== Infinity && usageCount >= monthlyLimit;
    const isNearLimit = monthlyLimit !== Infinity && usageCount >= monthlyLimit * 0.8;
    const remainingQuota = monthlyLimit === Infinity ? Infinity : Math.max(0, monthlyLimit - usageCount);

    return NextResponse.json({
      usageCount,
      limit: monthlyLimit,
      remainingQuota,
      usagePercentage: Math.round(usagePercentage),
      daysUntilReset,
      plan: planName,
      isAtLimit,
      isNearLimit,
      hasActiveSubscription: subscription !== null && !subscription.canceldate,
    });
  } catch (error) {
    console.error("Error fetching usage stats:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch usage stats",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
