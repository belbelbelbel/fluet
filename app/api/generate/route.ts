import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { GetUserByClerkId, SaveGeneratedContent, GetUserSubscription, GetUserUsageCount } from "@/utils/db/actions";

// Mark route as dynamic
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // Authenticate the user
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { prompt, contentType, tone, style, length, userId: clientUserId } = body;

    // Verify the userId from the request matches the authenticated user
    if (clientUserId !== clerkUserId) {
      return NextResponse.json(
        { error: "User ID mismatch" },
        { status: 403 }
      );
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

    // Find user in database by Clerk ID
    const user = await GetUserByClerkId(clerkUserId);

    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please sign up first." },
        { status: 404 }
      );
    }

    // Check subscription and usage limits
    const subscription = await GetUserSubscription(user.id);
    const usageCount = await GetUserUsageCount(user.id);
    
    // Determine limit based on subscription plan
    let monthlyLimit = 0;
    if (subscription && !subscription.canceldate) {
      switch (subscription.plan.toLowerCase()) {
        case "basic":
          monthlyLimit = 100;
          break;
        case "pro":
          monthlyLimit = 500;
          break;
        case "enterprise":
          monthlyLimit = Infinity; // Unlimited
          break;
        default:
          monthlyLimit = 0; // No subscription
      }
    }
    
    if (usageCount >= monthlyLimit) {
      return NextResponse.json(
        { 
          error: `You've reached your monthly limit of ${monthlyLimit} posts. Please upgrade your plan to continue.`,
          limitReached: true,
          currentUsage: usageCount,
          limit: monthlyLimit
        },
        { status: 403 }
      );
    }

    // Generate content with customization
    const generatedContent = await generateAIContent(
      prompt, 
      contentType, 
      tone || "professional",
      style || "concise",
      length || "medium"
    );

    // Save generated content to database with customization
    const savedContent = await SaveGeneratedContent(
      user.id,
      prompt.trim(),
      generatedContent,
      contentType,
      tone,
      style,
      length
    );

    return NextResponse.json({
      content: generatedContent,
      id: savedContent.id,
      usageCount: usageCount + 1,
      limit: monthlyLimit,
    });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}

// AI generation function with customization
async function generateAIContent(
  prompt: string,
  contentType: string,
  tone: string,
  style: string,
  length: string
): Promise<string> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Build prompt with customization
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

  const baseContent: Record<string, string> = {
    twitter: `🧵 Thread: ${prompt}\n\n1/ Here's an engaging thread about this topic...\n\n2/ Let me break this down further...\n\n3/ The key takeaway is...\n\n#Thread #AI #Content`,
    instagram: `✨ ${prompt}\n\nThis is a captivating caption that engages your audience and tells a story. Use relevant hashtags and emojis to boost engagement! 📸\n\n#Instagram #Content #SocialMedia`,
    linkedin: `🚀 ${prompt}\n\nHere's a professional LinkedIn post that establishes thought leadership and provides value to your network.\n\nKey points:\n• Point 1\n• Point 2\n• Point 3\n\nWhat are your thoughts? Let's discuss in the comments below.\n\n#LinkedIn #Professional #Networking`,
    tiktok: `🎵 ${prompt}\n\n[VIDEO SCRIPT]\nHook (0-3s): Grab attention immediately\n\nBody (3-15s): Tell the story or share the tip\n\nCall to Action (15-30s): Encourage engagement\n\n---\n\nCAPTION:\n${prompt}\n\n💡 Pro tip: Keep it short, authentic, and relatable!\n\n---\n\nHASHTAGS:\n#${prompt.replace(/\s+/g, '')} #viral #fyp #foryou #trending #content #creator`,
  };

  const content = baseContent[contentType] || `Generated content about: ${prompt}`;
  
  // Add customization note (in real implementation, AI would use these parameters)
  return `${content}\n\n[Generated with ${toneDescription} tone, ${styleDescription} style, ${lengthDescription}]`;
}
