/**
 * Progress API for Video Generation
 * Returns current progress for a video generation job
 */

import { NextResponse } from "next/server";
import { getProgress } from "@/utils/youtube/progress-tracker";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId is required" },
        { status: 400 }
      );
    }

    const progress = getProgress(jobId);

    if (!progress) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Calculate time remaining
    const elapsed = (Date.now() - progress.startedAt) / 1000; // seconds
    const remaining = progress.totalDuration - progress.currentTime;
    const estimatedTimeRemaining = remaining > 0 && progress.currentTime > 0
      ? (elapsed / progress.currentTime) * remaining
      : null;

    return NextResponse.json({
      jobId: progress.jobId,
      percentage: progress.percentage,
      currentTime: progress.currentTime,
      totalDuration: progress.totalDuration,
      status: progress.status,
      message: progress.message,
      timeRemaining: estimatedTimeRemaining,
      elapsed: elapsed,
    });
  } catch (error) {
    console.error("[Progress API] Error:", error);
    return NextResponse.json(
      { error: "Failed to get progress" },
      { status: 500 }
    );
  }
}
