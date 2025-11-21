import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Authenticate the user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if Kora API key is configured
    if (!process.env.KORA_API_KEY) {
      console.error("KORA_API_KEY is not configured");
      return NextResponse.json(
        { error: "Kora is not configured. Please set KORA_API_KEY in your .env.local file." },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { priceId, userId: clientUserId, planName, amount } = body;

    // Verify the userId from the request matches the authenticated user
    if (clientUserId !== userId) {
      return NextResponse.json(
        { error: "User ID mismatch" },
        { status: 403 }
      );
    }

    if (!priceId || !planName || !amount) {
      return NextResponse.json(
        { error: "Price ID, plan name, and amount are required" },
        { status: 400 }
      );
    }

    // Get the base URL for success and cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    (req.headers.get("origin") || "http://localhost:3000");

    // Convert amount to smallest currency unit (e.g., cents for USD, kobo for NGN)
    // Assuming USD pricing, convert to cents. Adjust based on your currency.
    const amountInCents = Math.round(parseFloat(amount) * 100);

    // Kora API integration
    // Note: This is a template. Adjust based on Kora's actual API documentation
    const koraApiUrl = process.env.KORA_API_URL || "https://api.korapay.com/api/v1/charges";
    
    const koraPayload = {
      amount: amountInCents,
      currency: process.env.KORA_CURRENCY || "NGN", // Default to NGN for African market
      description: `Fluet AI - ${planName} Plan Subscription`,
      reference: `fluet_${userId}_${Date.now()}`, // Unique reference
      customer: {
        email: undefined, // Will be collected during checkout
        name: undefined,
      },
      metadata: {
        userId: userId,
        planName: planName,
        priceId: priceId,
      },
      redirect_url: `${baseUrl}/pricing?success=true&provider=kora&reference={reference}`,
      // Kora typically supports mobile money and bank transfers
      // Adjust payment methods based on Kora's API
    };

    // Make request to Kora API
    const koraResponse = await fetch(koraApiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.KORA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(koraPayload),
    });

    if (!koraResponse.ok) {
      const errorData = await koraResponse.json().catch(() => ({}));
      console.error("Kora API error:", errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to create Kora checkout session" },
        { status: koraResponse.status }
      );
    }

    const koraData = await koraResponse.json();

    // Kora typically returns a payment link or authorization URL
    // Adjust the response parsing based on Kora's actual API response structure
    const paymentLink = koraData.data?.authorization_url || 
                       koraData.data?.link || 
                       koraData.authorization_url || 
                       koraData.link;

    if (!paymentLink) {
      console.error("Kora response:", koraData);
      return NextResponse.json(
        { error: "Kora did not return a payment link. Please check your Kora API configuration." },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      paymentLink,
      reference: koraPayload.reference,
    });
  } catch (error) {
    console.error("Error creating Kora checkout session:", error);
    
    return NextResponse.json(
      { error: "Failed to create Kora checkout session" },
      { status: 500 }
    );
  }
}

