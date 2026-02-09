/**
 * Professional YouTube Video Generation API
 * Creates polished videos with smart asset matching, overlays, and effects
 */

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createProfessionalVideo, createSleepVideo, createRainVideo, createAmbientVideo } from "@/utils/youtube/video-generator";
import path from "path";
import { promises as fs } from "fs";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes max (for video generation)

interface GenerateVideoRequest {
  contentType: "rain_sounds" | "sleep_sounds" | "ambient_sounds" | "white_noise";
  title: string;
  subtitle?: string;
  durationMinutes: number;
  quality?: "high" | "medium" | "low";
  showWatermark?: boolean;
  showDuration?: boolean;
  colorGrading?: "warm" | "cool" | "natural" | "cinematic";
  userId?: string;
}

export async function POST(req: Request) {
  try {
    const body: GenerateVideoRequest = await req.json();
    const {
      contentType,
      title,
      subtitle,
      durationMinutes,
      quality = "high",
      showWatermark = false,
      showDuration = true,
      colorGrading = "natural",
      userId: clientUserId,
    } = body;

    // Authentication
    const authResult = await auth();
    let clerkUserId = authResult?.userId || clientUserId;

    if (!clerkUserId) {
      try {
        const user = await currentUser();
        clerkUserId = user?.id || null;
      } catch (error) {
        console.warn("currentUser() failed:", error);
      }
    }

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Validate inputs
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!contentType || !["rain_sounds", "sleep_sounds", "ambient_sounds", "white_noise"].includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid content type. Must be: rain_sounds, sleep_sounds, ambient_sounds, or white_noise" },
        { status: 400 }
      );
    }

    if (!durationMinutes || durationMinutes < 1 || durationMinutes > 480) {
      return NextResponse.json(
        { error: "Duration must be between 1 and 480 minutes (8 hours)" },
        { status: 400 }
      );
    }

    // Create output directory for videos
    const outputDir = path.join(process.cwd(), "public", "generated-videos");
    await fs.mkdir(outputDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const safeTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .substring(0, 50);
    const filename = `${safeTitle}-${timestamp}.mp4`;
    const outputPath = path.join(outputDir, filename);

    console.log(`[Video Generation API] 🎬 Starting professional video generation`);
    console.log(`[Video Generation API] Content: ${contentType} | Duration: ${durationMinutes}min | Quality: ${quality}`);

    // Generate video based on content type
    let result;
    
    if (contentType === "sleep_sounds" && durationMinutes === 480) {
      // Use specialized sleep video function for 8-hour videos
      result = await createSleepVideo(title, outputPath, showWatermark);
    } else if (contentType === "rain_sounds") {
      result = await createRainVideo(title, durationMinutes, outputPath, showWatermark);
    } else if (contentType === "ambient_sounds") {
      result = await createAmbientVideo(title, durationMinutes, outputPath, showWatermark);
    } else {
      // Use general professional video function
      result = await createProfessionalVideo({
        contentType,
        title,
        subtitle,
        durationMinutes,
        outputPath,
        quality,
        showWatermark,
        showDuration,
        colorGrading,
      });
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Video generation failed" },
        { status: 500 }
      );
    }

    // Return video info (relative path for client access)
    const relativePath = `/generated-videos/${filename}`;

    return NextResponse.json({
      success: true,
      video: {
        path: relativePath,
        absolutePath: result.outputPath,
        duration: result.duration,
        durationMinutes: result.duration ? Math.round(result.duration / 60) : durationMinutes,
        fileSize: result.fileSize,
        fileSizeMB: result.fileSize ? (result.fileSize / 1024 / 1024).toFixed(2) : null,
      },
      message: "Professional video generated successfully!",
    });
  } catch (error) {
    console.error("[Video Generation API] ❌ Error:", error);
    return NextResponse.json(
      {
        error: "Video generation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
