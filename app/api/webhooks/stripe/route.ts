import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { GetUserByClerkId } from "@/utils/db/actions";
import { db } from "@/utils/db/dbConfig";
import { Subscription } from "@/utils/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    console.error("❌ Stripe webhook: No signature provided");
    return NextResponse.json(
      { error: "No signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log(`✅ Stripe webhook verified: ${event.type}`);
  } catch (err) {
    console.error("❌ Stripe webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
      default:
        console.log(`ℹ️ Unhandled Stripe webhook event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Error processing Stripe webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    // Idempotency: Check if we've already processed this session
    const sessionId = session.id;
    console.log(`[Stripe Webhook] Processing checkout.session.completed: ${sessionId}`);

    const clerkUserId = session.metadata?.userId || session.client_reference_id;
    
    if (!clerkUserId) {
      console.error("❌ No userId found in checkout session metadata");
      // Try to get from customer email as fallback
      const customerEmail = session.customer_details?.email;
      if (customerEmail) {
        console.log(`[Stripe Webhook] Attempting to find user by email: ${customerEmail}`);
        // You could implement a GetUserByEmail function if needed
      }
      throw new Error("Missing userId in checkout session");
    }

    // Get the subscription from Stripe to determine the plan
    let planName = session.metadata?.planName?.toLowerCase() || "basic";
    let subscriptionId: string | null = null;
    let startDate = new Date();
    let endDate = new Date();
    
    // If session has a subscription, fetch it to get the plan details
    if (session.subscription) {
      subscriptionId = session.subscription as string;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      // Extract plan name from subscription
      const priceId = subscription.items.data[0]?.price.id;
      
      // Map price IDs to plan names (comprehensive mapping)
      const priceIdToPlan: Record<string, string> = {
        "price_1PyFKGBibz3ZDixDAaJ3HO74": "starter",
        "price_1PyFN0Bibz3ZDixDqm9eYL8W": "professional",
        // Add more price IDs as needed
      };
      
      if (priceId && priceIdToPlan[priceId]) {
        planName = priceIdToPlan[priceId];
      }
      
      // Use actual subscription dates
      startDate = new Date(subscription.current_period_start * 1000);
      endDate = new Date(subscription.current_period_end * 1000);
    } else {
      // For one-time payments, set 30-day period
      endDate.setMonth(endDate.getMonth() + 1);
    }

    console.log(`[Stripe Webhook] Processing checkout for user: ${clerkUserId}, plan: ${planName}, subscription: ${subscriptionId || 'none'}`);

    const user = await GetUserByClerkId(clerkUserId);
    if (!user) {
      console.error(`❌ User not found for Clerk ID: ${clerkUserId}`);
      throw new Error(`User not found: ${clerkUserId}`);
    }

    // Check if subscription already exists (idempotency check)
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

    const finalSubscriptionId = subscriptionId || `stripe_${sessionId}`;

    if (existingSubscription) {
      // Update existing subscription (idempotent operation)
      await db
        .update(Subscription)
        .set({
          stripesubscripionId: finalSubscriptionId,
          plan: planName,
          startdate: startDate,
          enddate: endDate,
          canceldate: false,
        })
        .where(eq(Subscription.userid, user.id))
        .execute();
      
      console.log(`✅ Updated subscription for user ${user.id}: ${planName} (${startDate.toISOString()} - ${endDate.toISOString()})`);
    } else {
      // Create new subscription
      await db.insert(Subscription).values({
        stripesubscripionId: finalSubscriptionId,
        userid: user.id,
        plan: planName,
        startdate: startDate,
        enddate: endDate,
        canceldate: false,
      });
      
      console.log(`✅ Created new subscription for user ${user.id}: ${planName} (${startDate.toISOString()} - ${endDate.toISOString()})`);
    }

    // Return success for idempotency tracking
    return { success: true, userId: user.id, plan: planName };
  } catch (error) {
    console.error("❌ Error handling checkout completed:", error);
    // Don't throw - log and return to prevent webhook retry loops
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    // Get customer ID and find user
    const customerId = subscription.customer as string;
    const customer = await stripe.customers.retrieve(customerId);
    
    // Try to find user by email or metadata
    let clerkUserId: string | null = null;
    
    if (typeof customer === "object" && !customer.deleted) {
      clerkUserId = customer.metadata?.userId || customer.metadata?.clerkUserId || null;
    }

    if (!clerkUserId) {
      console.error("❌ Could not find userId for subscription update");
      return;
    }

    const user = await GetUserByClerkId(clerkUserId);
    if (!user) {
      console.error(`❌ User not found for Clerk ID: ${clerkUserId}`);
      return;
    }

    // Extract plan name from subscription
    const priceId = subscription.items.data[0]?.price.id;
    const priceIdToPlan: Record<string, string> = {
      "price_1PyFKGBibz3ZDixDAaJ3HO74": "starter",
      "price_1PyFN0Bibz3ZDixDqm9eYL8W": "professional",
    };
    
    const planName = priceId && priceIdToPlan[priceId] 
      ? priceIdToPlan[priceId] 
      : "basic";

    // Update subscription in database
    await db
      .update(Subscription)
      .set({
        plan: planName,
        startdate: new Date(subscription.current_period_start * 1000),
        enddate: new Date(subscription.current_period_end * 1000),
        canceldate: subscription.status !== "active" && subscription.status !== "trialing",
      })
      .where(eq(Subscription.userid, user.id))
      .execute();

    console.log(`✅ Updated subscription for user ${user.id}: ${planName} (status: ${subscription.status})`);
  } catch (error) {
    console.error("❌ Error handling subscription updated:", error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    const customer = await stripe.customers.retrieve(customerId);
    
    let clerkUserId: string | null = null;
    
    if (typeof customer === "object" && !customer.deleted) {
      clerkUserId = customer.metadata?.userId || customer.metadata?.clerkUserId || null;
    }

    if (!clerkUserId) {
      console.error("❌ Could not find userId for subscription deletion");
      return;
    }

    const user = await GetUserByClerkId(clerkUserId);
    if (!user) {
      console.error(`❌ User not found for Clerk ID: ${clerkUserId}`);
      return;
    }

    // Mark subscription as cancelled
    await db
      .update(Subscription)
      .set({
        canceldate: true,
      })
      .where(eq(Subscription.userid, user.id))
      .execute();

    console.log(`✅ Cancelled subscription for user ${user.id}`);
  } catch (error) {
    console.error("❌ Error handling subscription deleted:", error);
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Optionally handle successful invoice payments
  // This can be used to extend subscription periods or handle renewals
  console.log(`✅ Invoice payment succeeded: ${invoice.id}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Handle failed payments - you might want to notify the user or mark subscription as past due
  console.warn(`⚠️ Invoice payment failed: ${invoice.id}`);
}
