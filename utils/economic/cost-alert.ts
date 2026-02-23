/**
 * Economic Control: Cost vs Plan Revenue Alerts
 * Logs warning when agency AI cost exceeds threshold of plan revenue.
 * Used for margin visibility - no blocking, just operational awareness.
 */

import { GetAgencyAICostForPeriod } from "@/utils/db/actions";
import { GetUserSubscription } from "@/utils/db/actions";

/** Approximate monthly plan revenue in USD (for margin check) */
const PLAN_REVENUE_USD: Record<string, number> = {
  free: 0,
  starter: 7,
  basic: 7,
  professional: 18,
  pro: 18,
  enterprise: 50,
};

/** Alert when AI cost exceeds this % of plan revenue */
const COST_ALERT_THRESHOLD_PCT = 0.5;

/**
 * Check if agency's monthly AI cost exceeds threshold and log warning.
 * Call after each generation for real-time visibility.
 */
export async function checkCostAlert(agencyUserId: number): Promise<void> {
  try {
    const subscription = await GetUserSubscription(agencyUserId);
    const planName = (subscription?.plan?.toLowerCase() || "free") as string;
    const planRevenue = PLAN_REVENUE_USD[planName] ?? 0;

    // Skip alert for free or if no revenue baseline
    if (planRevenue <= 0) return;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { totalCostUsd } = await GetAgencyAICostForPeriod(
      agencyUserId,
      startOfMonth
    );

    const costRatio = totalCostUsd / planRevenue;
    if (costRatio >= COST_ALERT_THRESHOLD_PCT) {
      console.warn(
        `[Cost Alert] Agency ${agencyUserId} (${planName}): AI cost $${totalCostUsd.toFixed(2)} ` +
          `is ${(costRatio * 100).toFixed(0)}% of plan revenue $${planRevenue}. ` +
          `Consider usage review or plan upgrade.`
      );
    }
  } catch (error) {
    console.error("[Cost Alert] Error checking cost:", error);
  }
}
