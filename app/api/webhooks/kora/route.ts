import { NextResponse } from "next/server";
import { CreateOrUpdateUser, GetUserByClerkId } from "@/utils/db/actions";
import { db } from "@/utils/db/dbConfig";
import { Subscription, Users } from "@/utils/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    // Get the webhook signature from headers
    const signature = req.headers.get("x-kora-signature");
    const webhookSecret = process.env.KORA_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("KORA_WEBHOOK_SECRET is not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Verify webhook signature (adjust based on Kora's signature verification method)
    const body = await req.text();
    
    // TODO: Implement Kora signature verification
    // This is a placeholder - adjust based on Kora's actual signature verification method
    // const isValid = verifyKoraSignature(body, signature, webhookSecret);
    // if (!isValid) {
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    // }

    const event = JSON.parse(body);

    // Handle different Kora webhook events
    switch (event.event) {
      case "charge.success":
      case "charge.completed":
        // Payment successful - activate subscription
        await handleSuccessfulPayment(event.data);
        break;

      case "charge.failed":
        // Payment failed
        console.error("Kora payment failed:", event.data);
        break;

      default:
        console.log("Unhandled Kora webhook event:", event.event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing Kora webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleSuccessfulPayment(eventData: any) {
  try {
    // Extract user information from Kora webhook data
    // Adjust field names based on Kora's actual webhook payload structure
    const userId = eventData.metadata?.userId || eventData.customer?.userId;
    const planName = eventData.metadata?.planName;
    const priceId = eventData.metadata?.priceId;
    const reference = eventData.reference || eventData.id;

    if (!userId || !planName) {
      console.error("Missing userId or planName in Kora webhook:", eventData);
      return;
    }

    // Get or create user
    const user = await GetUserByClerkId(userId);
    if (!user) {
      console.error("User not found for Kora webhook:", userId);
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

    if (existingSubscription) {
      // Update existing subscription
      await db
        .update(Subscription)
        .set({
          plan: planName,
          startdate: new Date(),
          enddate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          canceldate: false,
        })
        .where(eq(Subscription.userid, user.id))
        .execute();
    } else {
      // Create new subscription
      await db.insert(Subscription).values({
        stripesubscripionId: `kora_${reference}`, // Store Kora reference
        userid: user.id,
        plan: planName,
        startdate: new Date(),
        enddate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        canceldate: false,
      });
    }

    console.log(`Kora subscription activated for user ${userId}, plan: ${planName}`);
  } catch (error) {
    console.error("Error handling successful Kora payment:", error);
    throw error;
  }
}

