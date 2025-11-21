import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { GetUserByClerkId, SaveGeneratedContent } from "@/utils/db/actions";

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
    const { prompt, contentType, userId: clientUserId } = body;

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

    if (!contentType || !["twitter", "instagram", "linkedin"].includes(contentType)) {
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

    // TODO: Integrate with AI service (OpenAI, Anthropic, etc.)
    // For now, return a placeholder response
    const generatedContent = await generateAIContent(prompt, contentType);

    // Save generated content to database
    const savedContent = await SaveGeneratedContent(
      user.id,
      prompt.trim(),
      generatedContent,
      contentType
    );

    return NextResponse.json({
      content: generatedContent,
      id: savedContent.id,
    });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}

// Placeholder AI generation function
// Replace this with actual AI service integration (OpenAI, Anthropic, etc.)
async function generateAIContent(
  prompt: string,
  contentType: string
): Promise<string> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Placeholder content based on type
  const contentTemplates: Record<string, string> = {
    twitter: `🧵 Thread: ${prompt}\n\n1/ Here's an engaging thread about this topic...\n\n2/ Let me break this down further...\n\n3/ The key takeaway is...\n\n#Thread #AI #Content`,
    instagram: `✨ ${prompt}\n\nThis is a captivating caption that engages your audience and tells a story. Use relevant hashtags and emojis to boost engagement! 📸\n\n#Instagram #Content #SocialMedia`,
    linkedin: `🚀 ${prompt}\n\nHere's a professional LinkedIn post that establishes thought leadership and provides value to your network.\n\nKey points:\n• Point 1\n• Point 2\n• Point 3\n\nWhat are your thoughts? Let's discuss in the comments below.\n\n#LinkedIn #Professional #Networking`,
  };

  return (
    contentTemplates[contentType] ||
    `Generated content about: ${prompt}\n\nThis is placeholder content. Please integrate with an AI service (OpenAI, Anthropic, etc.) to generate real content.`
  );
}

