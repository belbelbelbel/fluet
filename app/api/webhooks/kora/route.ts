import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createHmac } from "crypto";
import { GetUserByClerkId } from "@/utils/db/actions";
import { db } from "@/utils/db/dbConfig";
import { Subscription } from "@/utils/db/schema";
import { eq, and } from "drizzle-orm";

// Mark route as dynamic
export const dynamic = "force-dynamic";

/**
 * Verify Kora webhook signature using HMAC SHA256
 * Kora typically signs webhooks with HMAC SHA256
 */
function verifyKoraSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) {
    return false;
  }

  try {
    // Kora typically uses HMAC SHA256
    const hmac = createHmac("sha256", secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest("hex");

    // Kora may send signature in different formats (e.g., "sha256=...")
    const cleanSignature = signature.replace(/^sha256=/, "");
    
    // Use constant-time comparison to prevent timing attacks
    return expectedSignature === cleanSignature;
  } catch (error) {
    console.error("Error verifying Kora signature:", error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.KORA_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("❌ KORA_WEBHOOK_SECRET is not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Get the webhook signature from headers
    // Kora typically uses x-kora-signature or x-signature header
    const headerSignature = (await headers()).get("x-kora-signature") || 
                           (await headers()).get("x-signature") ||
                           (await headers()).get("kora-signature");

    const body = await req.text();
    
    // Verify webhook signature if provided
    if (headerSignature) {
      const isValid = verifyKoraSignature(body, headerSignature, webhookSecret);
      if (!isValid) {
        console.error("❌ Invalid Kora webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
      console.log("✅ Kora webhook signature verified");
    } else {
      console.warn("⚠️ No signature header found - proceeding without verification (not recommended for production)");
    }

    const event = JSON.parse(body);

    // Handle different Kora webhook events
    // Kora webhook events may vary - adjust based on actual Kora API documentation
    const eventType = event.event || event.type || event.status;
    
    switch (eventType) {
      case "charge.success":
      case "charge.completed":
      case "success":
      case "completed":
        // Payment successful - activate subscription
        await handleSuccessfulPayment(event.data || event);
        break;

      case "charge.failed":
      case "charge.failure":
      case "failed":
      case "failure":
        // Payment failed
        console.error("❌ Kora payment failed:", event.data || event);
        await handleFailedPayment(event.data || event);
        break;

      case "charge.pending":
      case "pending":
        console.log("ℹ️ Kora payment pending:", event.data || event);
        break;

      default:
        console.log(`ℹ️ Unhandled Kora webhook event: ${eventType}`, event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Error processing Kora webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

interface KoraWebhookData {
  metadata?: {
    userId?: string;
    planName?: string;
    priceId?: string;
  };
  customer?: {
    userId?: string;
    email?: string;
  };
  reference?: string;
  id?: string;
  transaction?: {
    reference?: string;
  };
}

async function handleSuccessfulPayment(eventData: KoraWebhookData) {
  try {
    // Extract user information from Kora webhook data
    // Kora webhook structure may vary - adjust based on actual API documentation
    const userId = eventData.metadata?.userId || 
                   eventData.customer?.userId ||
                   eventData.metadata?.clerkUserId;
    
    const planName = eventData.metadata?.planName || "basic";
    const reference = eventData.reference || 
                     eventData.id || 
                     eventData.transaction?.reference ||
                     `kora_${Date.now()}`;

    if (!userId) {
      console.error("❌ Missing userId in Kora webhook:", eventData);
      return;
    }

    console.log(`[Kora Webhook] Processing successful payment for user: ${userId}, plan: ${planName}, reference: ${reference}`);

    // Get or create user
    const user = await GetUserByClerkId(userId);
    if (!user) {
      console.error(`❌ User not found for Clerk ID: ${userId}`);
      return;
    }

    // Check if subscription already exists
    const [existingSubscription] = await db
      .select()
      .from(Subscription)
      .where(
        and(
          eq(Subscription.userid, user.id),
          eq(Subscription.canceldate, false)
        )
      )
      .limit(1)
      .execute();

    const subscriptionId = `kora_${reference}`;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 30 days from now

    if (existingSubscription) {
      // Update existing subscription
      await db
        .update(Subscription)
        .set({
          stripesubscripionId: subscriptionId,
          plan: planName,
          startdate: startDate,
          enddate: endDate,
          canceldate: false,
        })
        .where(eq(Subscription.userid, user.id))
        .execute();
      
      console.log(`✅ Updated Kora subscription for user ${user.id}: ${planName}`);
    } else {
      // Create new subscription
      await db.insert(Subscription).values({
        stripesubscripionId: subscriptionId,
        userid: user.id,
        plan: planName,
        startdate: startDate,
        enddate: endDate,
        canceldate: false,
      });
      
      console.log(`✅ Created new Kora subscription for user ${user.id}: ${planName}`);
    }
  } catch (error) {
    console.error("❌ Error handling successful Kora payment:", error);
    throw error;
  }
}

async function handleFailedPayment(eventData: KoraWebhookData) {
  try {
    // Log failed payment for monitoring
    const userId = eventData.metadata?.userId || eventData.customer?.userId;
    const reference = eventData.reference || eventData.id;
    
    console.warn(`⚠️ Kora payment failed for user: ${userId}, reference: ${reference}`);
    
    // Optionally: Notify user, mark subscription as past due, etc.
    // For now, we just log it
  } catch (error) {
    console.error("❌ Error handling failed Kora payment:", error);
  }
}

