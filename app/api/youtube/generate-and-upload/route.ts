/**
 * Integrated YouTube Video Generation + Upload API
 * Generates professional video and uploads directly to YouTube
 */

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createProfessionalVideo, createSleepVideo, createRainVideo, createAmbientVideo } from "@/utils/youtube/video-generator";
import { uploadVideoToYouTube, getCategoryId } from "@/utils/youtube/upload-service";
import { getYouTubeTokens } from "@/utils/youtube/token-manager";
import { updateProgress, completeProgress, errorProgress } from "@/utils/youtube/progress-tracker";
import path from "path";
import { promises as fs } from "fs";

export const dynamic = "force-dynamic";
export const maxDuration = 600; // 10 minutes max (for video generation + upload)

interface GenerateAndUploadRequest {
  contentType: "rain_sounds" | "sleep_sounds" | "ambient_sounds" | "white_noise";
  title: string;
  description?: string;
  tags?: string[];
  durationMinutes: number;
  quality?: "high" | "medium" | "low";
  privacyStatus?: "public" | "unlisted" | "private";
  scheduledPublishTime?: string; // ISO 8601 format
  showWatermark?: boolean;
  showDuration?: boolean;
  colorGrading?: "warm" | "cool" | "natural" | "cinematic";
  category?: string; // YouTube category name (e.g., "Music")
  userId?: string;
}

export async function POST(req: Request) {
  let generatedVideoPath: string | null = null;
  let jobId: string | null = null;

  try {
    let body: GenerateAndUploadRequest;
    try {
      body = await req.json();
    } catch (jsonError) {
      console.error("[Generate & Upload] ❌ Error parsing request body:", jsonError);
      return NextResponse.json(
        { error: "Invalid request body", details: "Failed to parse JSON" },
        { status: 400 }
      );
    }
    const {
      contentType,
      title,
      description,
      tags,
      durationMinutes,
      quality = "high",
      privacyStatus = "public",
      scheduledPublishTime,
      showWatermark = false,
      showDuration = true,
      colorGrading = "natural",
      category = "Music",
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

    // Check if YouTube is connected
    let youtubeTokens;
    try {
      youtubeTokens = await getYouTubeTokens(clerkUserId);
    } catch (tokenError) {
      console.error("[Generate & Upload] ❌ Error getting YouTube tokens:", tokenError);
      return NextResponse.json(
        { 
          error: "Failed to retrieve YouTube account information",
          details: tokenError instanceof Error ? tokenError.message : "Unknown error"
        },
        { status: 500 }
      );
    }
    
    if (!youtubeTokens) {
      return NextResponse.json(
        { error: "YouTube account not connected. Please connect your YouTube account first." },
        { status: 400 }
      );
    }

    console.log(`[Generate & Upload] 🎬 Starting video generation and upload`);
    console.log(`[Generate & Upload] Content: ${contentType} | Duration: ${durationMinutes}min | Quality: ${quality}`);

    // Generate job ID for progress tracking
    jobId = `video-${clerkUserId}-${Date.now()}`;

    // Step 1: Generate video
    const outputDir = path.join(process.cwd(), "public", "generated-videos");
    await fs.mkdir(outputDir, { recursive: true });

    const timestamp = Date.now();
    const safeTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .substring(0, 50);
    const filename = `${safeTitle}-${timestamp}.mp4`;
    const outputPath = path.join(outputDir, filename);
    generatedVideoPath = outputPath; // Track for cleanup

    let videoResult;
    
    try {
      // Generate video based on content type
      if (contentType === "sleep_sounds" && durationMinutes === 480) {
        videoResult = await createSleepVideo(title, outputPath, showWatermark, jobId);
      } else if (contentType === "rain_sounds") {
        videoResult = await createRainVideo(title, durationMinutes, outputPath, showWatermark, jobId);
      } else if (contentType === "ambient_sounds") {
        videoResult = await createAmbientVideo(title, durationMinutes, outputPath, showWatermark, jobId);
      } else {
        videoResult = await createProfessionalVideo({
          contentType,
          title,
          subtitle: description ? description.substring(0, 100) : undefined,
          durationMinutes,
          outputPath,
          quality,
          showWatermark,
          showDuration,
          colorGrading,
          jobId,
        });
      }
    } catch (videoGenError) {
      console.error("[Generate & Upload] ❌ Video generation error:", videoGenError);
      errorProgress(jobId, videoGenError instanceof Error ? videoGenError.message : "Video generation failed");
      return NextResponse.json(
        { 
          error: "Video generation failed",
          details: videoGenError instanceof Error ? videoGenError.message : "Unknown error"
        },
        { status: 500 }
      );
    }

    if (!videoResult.success || !videoResult.outputPath) {
      return NextResponse.json(
        { error: videoResult.error || "Video generation failed" },
        { status: 500 }
      );
    }

    console.log(`[Generate & Upload] ✅ Video generated: ${path.basename(outputPath)}`);

    // Step 2: Prepare metadata
    const categoryId = getCategoryId(category);
    const finalDescription = description || `${title}\n\nPerfect for sleep, study, meditation, and relaxation.`;
    const finalTags = tags || [
      contentType.replace("_", " "),
      "sleep sounds",
      "relaxation",
      "meditation",
      "background noise",
      "white noise",
      "ambient sounds",
    ];

    // Step 3: Upload to YouTube
    console.log(`[Generate & Upload] 📤 Uploading to YouTube...`);
    
    // Update progress to uploading
    updateProgress(jobId, videoResult.duration || durationMinutes * 60, "uploading", "Uploading video to YouTube...");
    
    // Validate scheduled publish time (YouTube requires at least 15 minutes in the future)
    // IMPORTANT: Recalculate right before upload since video generation can take a long time
    // Use 30-minute buffer to account for clock skew, processing delays, and network latency
    let validScheduledPublishTime: string | undefined = scheduledPublishTime;
    
    if (scheduledPublishTime) {
      const scheduledDate = new Date(scheduledPublishTime);
      const now = new Date();
      
      // Validate the date is valid
      if (isNaN(scheduledDate.getTime())) {
        console.error(`[Generate & Upload] ❌ Invalid scheduled date: ${scheduledPublishTime}`);
        validScheduledPublishTime = undefined; // Don't send invalid date
      } else {
        // Use 30 minutes buffer to account for clock skew and processing delays
        const minScheduledTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from NOW
        
        const minutesUntilScheduled = Math.round((scheduledDate.getTime() - now.getTime()) / 60000);
        
        console.log(`[Generate & Upload] 🔍 Validation check:`);
        console.log(`[Generate & Upload]   - Original scheduled time: ${scheduledPublishTime}`);
        console.log(`[Generate & Upload]   - Current server time: ${now.toISOString()}`);
        console.log(`[Generate & Upload]   - Minutes until scheduled: ${minutesUntilScheduled}`);
        console.log(`[Generate & Upload]   - Minimum required: 30 minutes`);
        
        // Always ensure it's at least 30 minutes away
        if (minutesUntilScheduled < 30) {
          validScheduledPublishTime = minScheduledTime.toISOString();
          const newMinutesAway = Math.round((minScheduledTime.getTime() - now.getTime()) / 60000);
          console.log(`[Generate & Upload] ⚠️  ADJUSTED: ${scheduledPublishTime} (${minutesUntilScheduled} min) → ${validScheduledPublishTime} (${newMinutesAway} min)`);
        } else {
          console.log(`[Generate & Upload] ✅ VALID: ${scheduledPublishTime} (${minutesUntilScheduled} minutes away)`);
        }
        
        // Final check - recalculate one more time right before logging
        const finalCheck = new Date();
        const finalMinutesAway = Math.round((new Date(validScheduledPublishTime).getTime() - finalCheck.getTime()) / 60000);
        console.log(`[Generate & Upload] 📤 FINAL: Sending publishAt="${validScheduledPublishTime}" to YouTube (${finalMinutesAway} minutes from now)`);
        
        if (finalMinutesAway < 15) {
          console.error(`[Generate & Upload] ❌ CRITICAL: Time is only ${finalMinutesAway} minutes away! Adjusting again...`);
          const emergencyAdjust = new Date(finalCheck.getTime() + 30 * 60 * 1000);
          validScheduledPublishTime = emergencyAdjust.toISOString();
          console.log(`[Generate & Upload] 🚨 EMERGENCY ADJUST: ${validScheduledPublishTime}`);
        }
      }
    } else {
      console.log(`[Generate & Upload] ℹ️  No scheduled time provided - video will be published immediately`);
    }
    
    // Refresh tokens right before upload to ensure they're valid
    // Video generation can take a long time, so tokens might expire during generation
    let freshTokens;
    try {
      freshTokens = await getYouTubeTokens(clerkUserId);
    } catch (tokenError) {
      console.error("[Generate & Upload] ❌ Error refreshing YouTube tokens:", tokenError);
      errorProgress(jobId, "Failed to refresh YouTube tokens");
      return NextResponse.json(
        { 
          error: "Failed to refresh YouTube authentication",
          details: tokenError instanceof Error ? tokenError.message : "Unknown error"
        },
        { status: 500 }
      );
    }
    
    if (!freshTokens) {
      errorProgress(jobId, "YouTube account not connected or token refresh failed");
      return NextResponse.json(
        { error: "YouTube account not connected. Please reconnect your YouTube account." },
        { status: 400 }
      );
    }
    
    // Final validation right before upload - double check the time is still valid
    if (validScheduledPublishTime) {
      const finalNow = new Date();
      const finalScheduled = new Date(validScheduledPublishTime);
      const finalMinutesAway = Math.round((finalScheduled.getTime() - finalNow.getTime()) / 60000);
      
      console.log(`[Generate & Upload] 🔍 PRE-UPLOAD CHECK:`);
      console.log(`[Generate & Upload]   - Time to send: ${validScheduledPublishTime}`);
      console.log(`[Generate & Upload]   - Current time: ${finalNow.toISOString()}`);
      console.log(`[Generate & Upload]   - Minutes away: ${finalMinutesAway}`);
      
      if (finalMinutesAway < 30) {
        const emergencyTime = new Date(finalNow.getTime() + 30 * 60 * 1000);
        validScheduledPublishTime = emergencyTime.toISOString();
        console.log(`[Generate & Upload] 🚨 EMERGENCY: Time was only ${finalMinutesAway} min away! Adjusted to ${validScheduledPublishTime}`);
      }
    }
    
    let uploadResult;
    try {
      uploadResult = await uploadVideoToYouTube(
        {
          videoPath: outputPath,
          title,
          description: finalDescription,
          tags: finalTags,
          category: categoryId,
          privacyStatus,
          scheduledPublishTime: validScheduledPublishTime,
        },
        freshTokens.userId,
        freshTokens.accessToken,
        freshTokens.refreshToken,
        freshTokens.expiresAt
      );
    } catch (uploadError) {
      // Mark progress as error
      errorProgress(jobId, uploadError instanceof Error ? uploadError.message : "Upload failed");
      throw uploadError; // Re-throw to be caught by outer try-catch
    }

    console.log(`[Generate & Upload] ✅ Video uploaded successfully!`);
    console.log(`[Generate & Upload] 🎬 Video ID: ${uploadResult.videoId}`);
    console.log(`[Generate & Upload] 🔗 URL: ${uploadResult.videoUrl}`);

    // Mark progress as completed
    completeProgress(jobId, "Video uploaded successfully!");

    // Step 4: Cleanup - Delete temporary video file
    try {
      await fs.unlink(outputPath);
      console.log(`[Generate & Upload] 🗑️  Cleaned up temporary file`);
    } catch (cleanupError) {
      console.warn(`[Generate & Upload] ⚠️  Failed to cleanup temporary file: ${cleanupError}`);
      // Don't fail the request if cleanup fails
    }

    return NextResponse.json({
      success: true,
      jobId, // Return jobId so frontend can track progress
      video: {
        videoId: uploadResult.videoId,
        videoUrl: uploadResult.videoUrl,
        status: uploadResult.status,
        duration: videoResult.duration,
        durationMinutes: videoResult.duration ? Math.round(videoResult.duration / 60) : durationMinutes,
        fileSize: videoResult.fileSize,
        fileSizeMB: videoResult.fileSize ? (videoResult.fileSize / 1024 / 1024).toFixed(2) : null,
      },
      message: uploadResult.status === "scheduled" 
        ? "Video generated and scheduled for upload!" 
        : "Video generated and uploaded successfully!",
    });
  } catch (error) {
    console.error("[Generate & Upload] ❌ Error:", error);

    // Mark progress as error if we have a jobId
    if (jobId) {
      errorProgress(jobId, error instanceof Error ? error.message : "Unknown error");
    }

    // Cleanup on error
    if (generatedVideoPath) {
      try {
        await fs.unlink(generatedVideoPath);
        console.log(`[Generate & Upload] 🗑️  Cleaned up temporary file after error`);
      } catch (cleanupError) {
        console.warn(`[Generate & Upload] ⚠️  Failed to cleanup after error: ${cleanupError}`);
      }
    }

    return NextResponse.json(
      {
        error: "Video generation and upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
