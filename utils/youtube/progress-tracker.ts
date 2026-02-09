/**
 * Progress Tracker for Video Generation
 * Stores progress updates in memory for real-time UI updates
 */

interface VideoProgress {
  jobId: string;
  percentage: number;
  currentTime: number; // seconds
  totalDuration: number; // seconds
  status: "generating" | "uploading" | "completed" | "error";
  message?: string;
  startedAt: number; // timestamp
  updatedAt: number; // timestamp
}

// In-memory storage (in production, use Redis or similar)
const progressStore = new Map<string, VideoProgress>();

/**
 * Initialize progress tracking for a job
 */
export function initProgress(jobId: string, totalDuration: number): void {
  progressStore.set(jobId, {
    jobId,
    percentage: 0,
    currentTime: 0,
    totalDuration,
    status: "generating",
    startedAt: Date.now(),
    updatedAt: Date.now(),
  });
}

/**
 * Update progress for a job
 */
export function updateProgress(
  jobId: string,
  currentTime: number,
  status?: VideoProgress["status"],
  message?: string
): void {
  const progress = progressStore.get(jobId);
  if (!progress) return;

  const percentage = Math.min(100, Math.round((currentTime / progress.totalDuration) * 100));
  
  progressStore.set(jobId, {
    ...progress,
    percentage,
    currentTime,
    status: status || progress.status,
    message,
    updatedAt: Date.now(),
  });
}

/**
 * Get current progress for a job
 */
export function getProgress(jobId: string): VideoProgress | null {
  return progressStore.get(jobId) || null;
}

/**
 * Mark job as completed
 */
export function completeProgress(jobId: string, message?: string): void {
  const progress = progressStore.get(jobId);
  if (!progress) return;

  progressStore.set(jobId, {
    ...progress,
    percentage: 100,
    currentTime: progress.totalDuration,
    status: "completed",
    message: message || "Video generation completed",
    updatedAt: Date.now(),
  });
}

/**
 * Mark job as error
 */
export function errorProgress(jobId: string, message: string): void {
  const progress = progressStore.get(jobId);
  if (!progress) return;

  progressStore.set(jobId, {
    ...progress,
    status: "error",
    message,
    updatedAt: Date.now(),
  });
}

/**
 * Clean up old progress entries (older than 1 hour)
 */
export function cleanupOldProgress(): void {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [jobId, progress] of progressStore.entries()) {
    if (progress.updatedAt < oneHourAgo) {
      progressStore.delete(jobId);
    }
  }
}

// Cleanup every 30 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupOldProgress, 30 * 60 * 1000);
}
