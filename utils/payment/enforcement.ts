import { db } from "@/utils/db/dbConfig";
import { Clients, Subscription } from "@/utils/db/schema";
import { Users } from "@/utils/db/schema";
import { eq, and } from "drizzle-orm";
import { GetUserByClerkId, GetUserSubscription } from "@/utils/db/actions";

export type PaymentStatus = "paid" | "overdue" | "pending";

export interface PaymentCheckResult {
  isBlocked: boolean;
  status: PaymentStatus;
  daysOverdue?: number;
  message?: string;
  gracePeriodDaysRemaining?: number;
}

/**
 * Check agency subscription status
 */
export async function checkAgencySubscription(
  clerkUserId: string
): Promise<PaymentCheckResult> {
  try {
    const user = await GetUserByClerkId(clerkUserId);
    if (!user) {
      return {
        isBlocked: true,
        status: "overdue",
        message: "User not found",
      };
    }

    const subscription = await GetUserSubscription(user.id);

    if (!subscription || subscription.canceldate) {
      return {
        isBlocked: true,
        status: "overdue",
        message: "No active subscription",
      };
    }

    // Check if subscription is expired
    const now = new Date();
    const endDate = new Date(subscription.enddate);

    if (endDate < now) {
      const daysOverdue = Math.floor(
        (now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // 3-day grace period
      if (daysOverdue <= 3) {
        return {
          isBlocked: false,
          status: "overdue",
          daysOverdue,
          gracePeriodDaysRemaining: 3 - daysOverdue,
          message: `Subscription expired ${daysOverdue} day${daysOverdue > 1 ? "s" : ""} ago. ${3 - daysOverdue} day${3 - daysOverdue !== 1 ? "s" : ""} remaining in grace period.`,
        };
      }

      return {
        isBlocked: true,
        status: "overdue",
        daysOverdue,
        message: `Subscription expired ${daysOverdue} days ago. Please renew to continue.`,
      };
    }

    return {
      isBlocked: false,
      status: "paid",
    };
  } catch (error) {
    console.error("[checkAgencySubscription] Error:", error);
    return {
      isBlocked: true,
      status: "overdue",
      message: "Error checking subscription status",
    };
  }
}

/**
 * Check client payment status
 */
export async function checkClientPayment(
  clientId: number,
  agencyUserId: number
): Promise<PaymentCheckResult> {
  try {
    const [client] = await db
      .select()
      .from(Clients)
      .where(
        and(
          eq(Clients.id, clientId),
          eq(Clients.agencyId, agencyUserId)
        )
      )
      .limit(1)
      .execute();

    if (!client) {
      return {
        isBlocked: false,
        status: "paid",
      };
    }

    if (client.paymentStatus === "paid") {
      return {
        isBlocked: false,
        status: "paid",
      };
    }

    if (client.paymentStatus === "overdue") {
      // Calculate days overdue
      let daysOverdue = 0;
      if (client.paymentDueDate) {
        const dueDate = new Date(client.paymentDueDate);
        const now = new Date();
        daysOverdue = Math.floor(
          (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      // 3-day grace period
      if (daysOverdue <= 3) {
        return {
          isBlocked: false,
          status: "overdue",
          daysOverdue,
          gracePeriodDaysRemaining: 3 - daysOverdue,
          message: `Payment overdue (Day ${daysOverdue} of 3 grace period)`,
        };
      }

      return {
        isBlocked: true,
        status: "overdue",
        daysOverdue,
        message: `Payment overdue for ${daysOverdue} days. Services paused.`,
      };
    }

    return {
      isBlocked: false,
      status: client.paymentStatus as PaymentStatus,
    };
  } catch (error) {
    console.error("[checkClientPayment] Error:", error);
    return {
      isBlocked: false,
      status: "paid",
    };
  }
}

/**
 * Check if action should be blocked due to payment
 */
export async function shouldBlockAction(
  clerkUserId: string,
  action: "generate" | "schedule" | "approve",
  clientId?: number
): Promise<{ blocked: boolean; reason?: string }> {
  // First check agency subscription
  const agencyCheck = await checkAgencySubscription(clerkUserId);
  if (agencyCheck.isBlocked) {
    return {
      blocked: true,
      reason: agencyCheck.message || "Subscription overdue",
    };
  }

  // If client-specific action, check client payment
  if (clientId && (action === "generate" || action === "schedule")) {
    const user = await GetUserByClerkId(clerkUserId);
    if (user) {
      const clientCheck = await checkClientPayment(clientId, user.id);
      if (clientCheck.isBlocked) {
        return {
          blocked: true,
          reason: clientCheck.message || "Client payment overdue",
        };
      }
    }
  }

  // Approvals are never blocked (as per expert advice)
  if (action === "approve") {
    return { blocked: false };
  }

  return { blocked: false };
}
