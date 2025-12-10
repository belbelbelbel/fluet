import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { GetUserByClerkId, SaveGeneratedContent, GetUserSubscription, GetUserUsageCount, CreateOrUpdateUser } from "@/utils/db/actions";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // Parse body first to get client userId
    const body = await req.json();
    const { prompt, contentType, tone, style, length, userId: clientUserId } = body;

    // Get authentication from Clerk
    const authResult = await auth();
    const clerkUserId = authResult?.userId || clientUserId;

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

    if (!contentType || !["twitter", "instagram", "linkedin", "tiktok"].includes(contentType)) {
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
    
    try {
      // First, try to get existing user
      user = await GetUserByClerkId(clerkUserId);
      
      // If user doesn't exist, create them
      if (!user || !user.id) {
        console.log(`Creating new user for Clerk ID: ${clerkUserId}`);
        
        // Try to get user details from Clerk
        let userEmail = `${clerkUserId}@fluet.local`;
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
        } catch (clerkError) {
          console.warn("Could not fetch Clerk user details, using fallback:", clerkError);
        }
        
        // Create the user in our database
        user = await CreateOrUpdateUser(clerkUserId, userEmail, userName);
        console.log(`✅ User created/updated: ${user.id}`);
      } else {
        console.log(`✅ User found: ${user.id}`);
      }
      
      // Get subscription and usage info
      if (user && user.id) {
        try {
          const subscription = await GetUserSubscription(user.id);
          usageCount = await GetUserUsageCount(user.id);
          
          if (subscription && !subscription.canceldate) {
            switch (subscription.plan.toLowerCase()) {
              case "basic":
                monthlyLimit = 100;
                break;
              case "pro":
                monthlyLimit = 500;
                break;
              case "enterprise":
                monthlyLimit = Infinity;
                break;
            }
          }
        } catch (subError) {
          console.warn("Could not fetch subscription info:", subError);
          // Continue with default limits
        }
      }
    } catch (error) {
      console.error("❌ Error getting/creating user:", error);
      return NextResponse.json(
        { 
          error: "Failed to authenticate user",
          details: error instanceof Error ? error.message : "Unknown error"
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

    const generatedContent = await generateAIContent(
      prompt, 
      contentType, 
      tone || "professional",
      style || "concise",
      length || "medium"
    );

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

    return NextResponse.json({
      content: generatedContent,
      id: savedContentId,
      usageCount: usageCount + 1,
      limit: monthlyLimit,
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

async function generateAIContent(
  prompt: string,
  contentType: string,
  tone: string,
  style: string,
  length: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const openai = new OpenAI({
    apiKey: apiKey,
  });

  // Map tone, style, and length to descriptions
  const toneDescription = {
    professional: "professional and business-focused",
    casual: "casual and friendly",
    funny: "humorous and entertaining",
    inspiring: "motivational and uplifting",
    educational: "informative and educational"
  }[tone] || "professional";

  const styleDescription = {
    concise: "concise and to the point",
    detailed: "detailed and comprehensive",
    storytelling: "narrative and story-driven",
    "list-based": "organized as a clear list"
  }[style] || "concise";
  
  const lengthDescription = {
    short: "brief (50-100 words)",
    medium: "medium length (100-300 words)",
    long: "detailed (300+ words)"
  }[length] || "medium length";

  const platformInstructions: Record<string, string> = {
    twitter: `Create a Twitter thread about "${prompt}". Format it as a numbered thread (1/, 2/, 3/, etc.) with engaging, conversational tweets. Include relevant hashtags at the end. Make it ${toneDescription} in tone, ${styleDescription} in style, and ${lengthDescription} in length.

IMPORTANT: Use ONLY plain text. NO markdown formatting, NO asterisks (*), NO bold text, NO numbered lists with asterisks. Just clean, readable text that can be copied directly to Twitter.`,
    instagram: `Create an Instagram caption about "${prompt}". Make it engaging, visually descriptive, and include relevant emojis and hashtags. The tone should be ${toneDescription}, style should be ${styleDescription}, and length should be ${lengthDescription}.

IMPORTANT: Use ONLY plain text. NO markdown formatting, NO asterisks (*), NO bold text. Just clean, readable text that can be copied directly to Instagram.`,
    linkedin: `Create a professional LinkedIn post about "${prompt}". Make it thought-provoking and valuable for a professional network. Include a clear structure with key points. The tone should be ${toneDescription}, style should be ${styleDescription}, and length should be ${lengthDescription}.

IMPORTANT: Use ONLY plain text. NO markdown formatting, NO asterisks (*), NO bold text, NO numbered lists with asterisks. Just clean, readable text that can be copied directly to LinkedIn.`,
    tiktok: `Create TikTok content about "${prompt}". Include:
1. A video script with Hook (0-3s), Body (3-15s), and Call to Action (15-30s)
2. A catchy caption
3. Relevant hashtags

Make it ${toneDescription} in tone, ${styleDescription} in style, and keep it engaging and authentic.

IMPORTANT: Use ONLY plain text. NO markdown formatting, NO asterisks (*), NO bold text. Just clean, readable text that can be copied directly to TikTok.`
  };

  const systemPrompt = `You are an expert social media content creator. Generate high-quality, engaging content optimized for the specified platform. Follow the user's instructions precisely for tone, style, and length.

CRITICAL: Always output content in PLAIN TEXT format only. Never use markdown formatting, asterisks (*), bold markers (**), or any other formatting symbols. The content should be ready to copy and paste directly into the social media platform without any formatting cleanup needed.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: platformInstructions[contentType] || `Create ${contentType} content about "${prompt}" with ${toneDescription} tone, ${styleDescription} style, and ${lengthDescription} length.`,
        },
      ],
      temperature: 0.8,
      max_tokens: 1000,
    });

    let generatedContent = completion.choices[0]?.message?.content;
    
    if (!generatedContent) {
      throw new Error("No content generated from OpenAI");
    }

    // Clean up any markdown formatting that might have slipped through
    // Remove bold markers (**text** or __text__)
    generatedContent = generatedContent.replace(/\*\*(.*?)\*\*/g, '$1');
    generatedContent = generatedContent.replace(/__(.*?)__/g, '$1');
    // Remove italic markers (*text* or _text_)
    generatedContent = generatedContent.replace(/\*(.*?)\*/g, '$1');
    generatedContent = generatedContent.replace(/_(.*?)_/g, '$1');
    // Remove code blocks
    generatedContent = generatedContent.replace(/```[\s\S]*?```/g, '');
    generatedContent = generatedContent.replace(/`(.*?)`/g, '$1');
    // Remove markdown headers
    generatedContent = generatedContent.replace(/^#{1,6}\s+/gm, '');
    // Remove markdown links but keep the text
    generatedContent = generatedContent.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    // Remove markdown lists with asterisks (but keep numbered lists like 1/, 2/)
    generatedContent = generatedContent.replace(/^\s*[\*\-\+]\s+/gm, '');
    // Clean up extra whitespace
    generatedContent = generatedContent.replace(/\n{3,}/g, '\n\n').trim();

    return generatedContent;
  } catch (error) {
    console.error("OpenAI API error:", error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        throw new Error("OpenAI API key is invalid or missing. Please check your configuration.");
      } else if (error.message.includes("rate limit")) {
        throw new Error("OpenAI API rate limit exceeded. Please try again in a moment.");
      } else if (error.message.includes("insufficient_quota")) {
        throw new Error("OpenAI API quota exceeded. Please check your OpenAI account.");
      } else {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
    }
    
    throw new Error("Failed to generate content with AI. Please try again.");
  }
}
