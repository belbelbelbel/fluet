import { auth, currentUser } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { GetUserByClerkId, SaveGeneratedContent, CreateOrUpdateUser } from "@/utils/db/actions";
import { checkUsageLimit } from "@/utils/subscription/limits";
import { getAIGenerator } from "@/utils/ai/optimized-generator";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // Parse body first to get client userId
    const body = await req.json();
    const { prompt, contentType, tone, style, length, userId: clientUserId } = body;

    // Get authentication from Clerk - try multiple methods (same pattern as other routes)
    const authResult = await auth();
    let clerkUserId = authResult?.userId || clientUserId;
    
    // If auth() didn't work, try currentUser() as fallback
    if (!clerkUserId) {
      try {
        const user = await currentUser();
        clerkUserId = user?.id || null;
      } catch (userError) {
        console.warn("currentUser() failed:", userError);
      }
    }

    // Log authentication status for debugging
    if (!clerkUserId) {
      console.warn("⚠️ No userId found - auth failed, trying fallbacks");
    }

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!contentType || !["twitter", "instagram", "linkedin", "tiktok", "youtube"].includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }


    // At this point, clerkUserId should be defined, but TypeScript doesn't know that
    if (!clerkUserId) {
      console.error("❌ Authentication failed - no userId available");
      return NextResponse.json(
        { 
          error: "Authentication required",
          details: "Please sign in to generate content. If you're already signed in, please try refreshing the page."
        },
        { status: 401 }
      );
    }

    // Get or create user - this is required for saving content
    let user;
    let monthlyLimit = Infinity;
    let usageCount = 0;
    
    // Initialize usageStatus with default values to prevent undefined errors
    let usageStatus = {
      canGenerate: true,
      usageCount: 0,
      limit: 10,
      remaining: 10,
      percentageUsed: 0,
      daysUntilReset: 30,
      isNearLimit: false,
      isInGracePeriod: false,
      gracePeriodDaysRemaining: 0,
      planName: "Free",
      upgradeRecommended: false,
    };
    
    try {
      console.log(`[Generate API] Attempting to get/create user for Clerk ID: ${clerkUserId}`);
      
      // First, try to get existing user
      try {
        user = await GetUserByClerkId(clerkUserId);
      } catch (getUserError) {
        console.error("[Generate API] Error getting user:", getUserError);
        // Continue to create user
        user = null;
      }
      
      // If user doesn't exist, create them
      if (!user || !user.id) {
        console.log(`[Generate API] User not found, creating new user for Clerk ID: ${clerkUserId}`);
        
        // Try to get user details from Clerk
        let userEmail = `${clerkUserId}@flippr.local`;
        let userName = `User ${clerkUserId}`;
        
        try {
          const client = await clerkClient();
          const clerkUser = await client.users.getUser(clerkUserId);
          if (clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
            userEmail = clerkUser.emailAddresses[0].emailAddress;
          }
          if (clerkUser.firstName || clerkUser.lastName) {
            userName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || userName;
          }
          console.log(`[Generate API] Fetched Clerk user details - Email: ${userEmail}, Name: ${userName}`);
        } catch (clerkError) {
          console.warn("[Generate API] Could not fetch Clerk user details, using fallback:", clerkError);
        }
        
        // Create the user in our database
        try {
          user = await CreateOrUpdateUser(clerkUserId, userEmail, userName);
          if (!user || !user.id) {
            throw new Error("CreateOrUpdateUser returned null or user without id");
          }
          console.log(`[Generate API] ✅ User created/updated successfully: ${user.id}`);
        } catch (createError) {
          console.error("[Generate API] ❌ Error creating user:", createError);
          throw new Error(`Failed to create user: ${createError instanceof Error ? createError.message : String(createError)}`);
        }
      } else {
        console.log(`[Generate API] ✅ User found: ${user.id}`);
      }
      
      // Check usage limits using professional limits manager
      try {
        usageStatus = await checkUsageLimit(clerkUserId);
        usageCount = usageStatus.usageCount;
        monthlyLimit = usageStatus.limit;
      } catch (limitError) {
        console.error("[Generate API] Error checking usage limits:", limitError);
        // Keep default values already set above
        usageCount = 0;
        monthlyLimit = 10;
      }
    } catch (error) {
      console.error("[Generate API] ❌ Error getting/creating user:", error);
      console.error("[Generate API] Error details:", error instanceof Error ? error.stack : String(error));
      return NextResponse.json(
        { 
          error: "Failed to authenticate user",
          details: error instanceof Error ? error.message : "Failed to get user",
          message: "Please ensure you are signed in and try again. If the problem persists, please refresh the page."
        },
        { status: 500 }
      );
    }
    
    // Ensure we have a valid user before proceeding
    if (!user || !user.id) {
      console.error("❌ No valid user after creation attempt");
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 }
      );
    }

    // ============================================
    // PROFESSIONAL SUBSCRIPTION ENFORCEMENT
    // ============================================
    if (!usageStatus.canGenerate) {
      const isFreeTier = usageStatus.planName === "Free";
      const message = usageStatus.isInGracePeriod
        ? `You've exceeded your ${usageStatus.planName} plan limit (${usageCount}/${monthlyLimit}). You have ${usageStatus.gracePeriodDaysRemaining} days of grace period remaining. Upgrade now to avoid interruption.`
        : isFreeTier
        ? `You've used all ${monthlyLimit} free posts this month. Upgrade to a paid plan to continue generating content.`
        : `You've used all ${monthlyLimit} posts for your ${usageStatus.planName} plan this month. Upgrade your plan or wait ${usageStatus.daysUntilReset} days for your quota to reset.`;
      
      console.warn(`[Generate API] ⚠️ Limit exceeded for user ${user.id}: ${usageCount}/${monthlyLimit} (${usageStatus.planName} plan)`);
      
      return NextResponse.json(
        { 
          error: "Monthly limit reached",
          details: message,
          usageCount,
          limit: monthlyLimit,
          remaining: usageStatus.remaining,
          daysUntilReset: usageStatus.daysUntilReset,
          upgradeRequired: true,
          isFreeTier,
          currentPlan: usageStatus.planName,
          isInGracePeriod: usageStatus.isInGracePeriod,
          gracePeriodDaysRemaining: usageStatus.gracePeriodDaysRemaining,
        },
        { status: 403 }
      );
    }
    
    // Log warning if near limit
    if (usageStatus.isNearLimit) {
      console.log(`[Generate API] ⚠️ User ${user.id} is near limit: ${usageCount}/${monthlyLimit} (${usageStatus.remaining} remaining, ${usageStatus.percentageUsed.toFixed(1)}% used)`);
    }

    // ============================================
    // PROFESSIONAL AI CONTENT GENERATION
    // ============================================
    const aiGenerator = getAIGenerator();
    const generationResult = await aiGenerator.generate(prompt, {
      contentType,
      tone: tone || "professional",
      style: style || "concise",
      length: length || "medium",
      usePremium: usageStatus.planName === "Enterprise", // Use premium model for enterprise
    });
    
    const generatedContent = generationResult.content;
    
    // Log generation metrics
    console.log(`[Generate API] ✅ Content generated | Model: ${generationResult.model} | Tokens: ${generationResult.tokensUsed} | Cost: $${generationResult.cost.toFixed(4)}`);

    // Verify user exists in database before saving
    try {
      const verifyUser = await GetUserByClerkId(clerkUserId);
      if (!verifyUser || verifyUser.id !== user.id) {
        console.error(`User ID mismatch: Expected ${user.id}, Got ${verifyUser?.id}`);
        throw new Error("User verification failed - user ID mismatch");
      }
      console.log(`✅ Verified user exists: ${user.id}`);
    } catch (verifyError) {
      console.error("❌ User verification failed:", verifyError);
      return NextResponse.json(
        { 
          error: "User verification failed",
          details: verifyError instanceof Error ? verifyError.message : "Unknown error"
        },
        { status: 500 }
      );
    }

    // Save content to history - this is required
    let savedContentId = null;
    try {
      console.log(`Attempting to save content for user ID: ${user.id}`);
      console.log(`Content length: ${generatedContent.length}, Prompt length: ${prompt.trim().length}`);
      console.log(`Content type: ${contentType}, Tone: ${tone || 'none'}, Style: ${style || 'none'}, Length: ${length || 'none'}`);
      
      const savedContent = await SaveGeneratedContent(
        user.id,
        prompt.trim(),
        generatedContent,
        contentType,
        tone || null,
        style || null,
        length || null
      );
      
      if (!savedContent || !savedContent.id) {
        throw new Error("Save operation returned no content ID");
      }
      
      savedContentId = savedContent.id;
      console.log("✅ Content saved to database with ID:", savedContentId);
    } catch (saveError) {
      console.error("❌ Error saving content to database:", saveError);
      // Log detailed error for debugging
      if (saveError instanceof Error) {
        console.error("Save error message:", saveError.message);
        console.error("Save error stack:", saveError.stack);
      } else {
        console.error("Save error (not Error instance):", JSON.stringify(saveError));
      }
      
      // Return error - we need content to be saved
      return NextResponse.json(
        { 
          error: "Failed to save content to history",
          details: saveError instanceof Error ? saveError.message : String(saveError)
        },
        { status: 500 }
      );
    }

    // Return success response with comprehensive usage info
    const updatedUsageCount = usageCount + 1;
    const updatedRemaining = monthlyLimit === Infinity ? Infinity : Math.max(0, monthlyLimit - updatedUsageCount);
    
    return NextResponse.json({
      content: generatedContent,
      id: savedContentId,
      usage: {
        count: updatedUsageCount,
        limit: monthlyLimit,
        remaining: updatedRemaining,
        percentageUsed: monthlyLimit === Infinity ? 0 : (updatedUsageCount / monthlyLimit) * 100,
        daysUntilReset: usageStatus.daysUntilReset,
        isNearLimit: monthlyLimit !== Infinity && updatedUsageCount >= monthlyLimit * 0.8,
        upgradeRecommended: monthlyLimit !== Infinity && (updatedUsageCount / monthlyLimit) >= 0.9,
      },
      plan: {
        name: usageStatus.planName,
        isActive: usageStatus.planName !== "Free",
      },
      generation: {
        model: generationResult.model,
        tokensUsed: generationResult.tokensUsed,
        cost: generationResult.cost,
      },
    });
  } catch (error) {
    console.error("Error generating content:", error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorDetails = error instanceof Error ? error.stack : String(error);
    
    console.error("Error details:", errorDetails);
    
    return NextResponse.json(
      { 
        error: "Failed to generate content",
        details: errorMessage,
        // Only include stack in development
        ...(process.env.NODE_ENV === 'development' && { stack: errorDetails })
      },
      { status: 500 }
    );
  }
}

