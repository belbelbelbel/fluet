/**
 * Professional YouTube Video Composer
 * Creates polished, professional videos with smart matching, overlays, and effects
 */

import ffmpeg from "fluent-ffmpeg";
import { promises as fs } from "fs";
import path from "path";
import { AudioAsset, VisualAsset, getAssetPair, getRandomAssetPair } from "./asset-manager";
import { initProgress, updateProgress, completeProgress, errorProgress } from "./progress-tracker";

export interface VideoOverlay {
  type: "title" | "subtitle" | "watermark" | "duration" | "brand";
  text?: string;
  position: "top" | "center" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  opacity?: number;
  startTime?: number; // in seconds
  duration?: number; // in seconds (0 = show entire video)
}

export interface VideoGenerationOptions {
  audioAsset: AudioAsset;
  visualAsset: VisualAsset;
  targetDuration: number; // in seconds (e.g., 1800 for 30 minutes)
  outputPath: string;
  quality?: "high" | "medium" | "low";
  title?: string; // Video title for overlay
  subtitle?: string; // Subtitle text
  showWatermark?: boolean; // Show app watermark
  showDuration?: boolean; // Show duration indicator
  fadeIn?: boolean; // Add fade in effect
  fadeOut?: boolean; // Add fade out effect
  colorGrading?: "warm" | "cool" | "natural" | "cinematic"; // Color grading preset
  overlays?: VideoOverlay[]; // Custom overlays
  jobId?: string; // Optional job ID for progress tracking
}

export interface VideoGenerationResult {
  success: boolean;
  outputPath?: string;
  duration?: number;
  fileSize?: number; // in bytes
  error?: string;
}

/**
 * Get video duration using FFmpeg
 */
async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      const duration = metadata.format.duration || 0;
      resolve(duration);
    });
  });
}

/**
 * Get audio duration using FFmpeg
 */
async function getAudioDuration(audioPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      const duration = metadata.format.duration || 0;
      resolve(duration);
    });
  });
}

/**
 * Build FFmpeg filter complex for professional video composition
 */
function buildVideoFilters(
  options: VideoGenerationOptions,
  settings: { videoBitrate: string; audioBitrate: string; resolution: string }
): string[] {
  const filters: string[] = [];
  const [width, height] = settings.resolution.split("x").map(Number);

  // Base video filter: scale and pad (loop is handled by stream_loop input option)
  filters.push(`scale=${width}:${height}:force_original_aspect_ratio=decrease`);
  filters.push(`pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black`);

  // Color grading
  if (options.colorGrading) {
    const colorFilters: Record<string, string> = {
      warm: "eq=saturation=1.1:brightness=0.05:contrast=1.05",
      cool: "eq=saturation=0.9:brightness=0.02:contrast=1.1",
      natural: "eq=saturation=1.0:brightness=0:contrast=1.0",
      cinematic: "eq=saturation=1.15:brightness=-0.05:contrast=1.1:gamma=1.05",
    };
    filters.push(colorFilters[options.colorGrading] || colorFilters.natural);
  }

  // Fade in/out effects
  if (options.fadeIn) {
    filters.push(`fade=t=in:st=0:d=2`); // 2 second fade in
  }
  if (options.fadeOut) {
    filters.push(`fade=t=out:st=${options.targetDuration - 2}:d=2`); // 2 second fade out
  }

  return filters;
}

/**
 * Build text overlay filter for FFmpeg
 * Uses a more compatible approach without requiring specific font files
 */
function buildTextOverlay(
  text: string,
  position: VideoOverlay["position"],
  fontSize: number = 48,
  fontColor: string = "white",
  backgroundColor?: string,
  opacity: number = 1.0
): string {
  const positions: Record<string, string> = {
    top: "x=(w-text_w)/2:y=50",
    center: "x=(w-text_w)/2:y=(h-text_h)/2",
    bottom: "x=(w-text_w)/2:y=h-th-50",
    "top-left": "x=50:y=50",
    "top-right": "x=w-tw-50:y=50",
    "bottom-left": "x=50:y=h-th-50",
    "bottom-right": "x=w-tw-50:y=h-th-50",
  };

  const pos = positions[position] || positions.center;
  
  // Escape text for FFmpeg
  const escapedText = text
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:");
  
  // Background box (optional)
  const bg = backgroundColor
    ? `:box=1:boxcolor=${backgroundColor}@${opacity}:boxborderw=10`
    : "";
  
  // Use default font (no fontfile needed - FFmpeg will use system default)
  // For better control, you can specify fontfile path if needed
  return `drawtext=text='${escapedText}':fontsize=${fontSize}:fontcolor=${fontColor}@${opacity}${bg}:${pos}`;
}

/**
 * Format duration for display (e.g., "8 Hours", "30 Minutes")
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} Hour${hours > 1 ? "s" : ""}`;
  }
  return `${minutes} Minute${minutes > 1 ? "s" : ""}`;
}

/**
 * Generate a professional looped video with professional effects
 * Handles both short videos (5 seconds) and short audio files
 */
export async function generateVideo(
  options: VideoGenerationOptions
): Promise<VideoGenerationResult> {
  const {
    audioAsset,
    visualAsset,
    targetDuration,
    outputPath,
    quality = "high",
    title,
    subtitle,
    showWatermark = false,
    showDuration = false,
    fadeIn = true,
    fadeOut = true,
    colorGrading = "natural",
    overlays = [],
    jobId,
  } = options;

  // Initialize progress tracking if jobId is provided
  if (jobId) {
    initProgress(jobId, targetDuration);
  }

  try {
    // Resolve actual file paths (from public folder)
    const audioPath = path.join(process.cwd(), "public", audioAsset.path);
    const visualPath = path.join(process.cwd(), "public", visualAsset.path);

    // Check if files exist
    try {
      await fs.access(audioPath);
      await fs.access(visualPath);
    } catch (error) {
      return {
        success: false,
        error: `Asset file not found: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }

    // Get actual durations
    const audioDuration = await getAudioDuration(audioPath);
    const videoDuration = await getVideoDuration(visualPath);

    console.log(`[Video Composer] 🎬 Creating professional video composition`);
    console.log(`[Video Composer] Audio: ${audioAsset.name} (${audioDuration}s)`);
    console.log(`[Video Composer] Visual: ${visualAsset.name} (${videoDuration}s)`);
    console.log(`[Video Composer] Target duration: ${targetDuration}s (${formatDuration(targetDuration)})`);

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // Quality settings
    const qualitySettings = {
      high: {
        videoBitrate: "5000k",
        audioBitrate: "192k",
        resolution: "1920x1080",
        crf: 20, // Higher quality
        preset: "slow", // Better compression
      },
      medium: {
        videoBitrate: "3000k",
        audioBitrate: "128k",
        resolution: "1280x720",
        crf: 23,
        preset: "medium",
      },
      low: {
        videoBitrate: "1500k",
        audioBitrate: "96k",
        resolution: "854x480",
        crf: 26,
        preset: "fast",
      },
    };

    const settings = qualitySettings[quality];

    return new Promise((resolve, reject) => {
      // Create FFmpeg command
      const command = ffmpeg();

      // Add inputs with looping
      // Use -stream_loop before each input for proper looping
      command.input(visualPath).inputOptions([`-stream_loop`, `-1`]);
      command.input(audioPath).inputOptions([`-stream_loop`, `-1`]);

      // Build video filters (without loop filter - using stream_loop instead)
      const videoFilters = buildVideoFilters(options, settings);
      // Remove loop filter if present (we're using stream_loop instead)
      const filteredVideoFilters = videoFilters.filter(f => !f.startsWith('loop='));
      let videoFilterChain = filteredVideoFilters.length > 0 ? filteredVideoFilters.join(",") : "";

      // Add text overlays
      const textOverlays: string[] = [];

      // Title overlay (first 10 seconds, centered top)
      if (title) {
        textOverlays.push(
          buildTextOverlay(
            title,
            "top",
            64,
            "white",
            "black@0.6",
            1.0
          )
        );
      }

      // Subtitle overlay (first 10 seconds, below title)
      if (subtitle) {
        textOverlays.push(
          buildTextOverlay(
            subtitle,
            "top",
            36,
            "#E0E0E0",
            undefined,
            0.9
          )
        );
      }

      // Duration indicator (top-right, always visible)
      if (showDuration) {
        const durationText = formatDuration(targetDuration);
        textOverlays.push(
          buildTextOverlay(
            durationText,
            "top-right",
            32,
            "white",
            "black@0.5",
            0.8
          )
        );
      }

      // Watermark (bottom-right, always visible)
      if (showWatermark) {
        textOverlays.push(
          buildTextOverlay(
            "Created with Fluet",
            "bottom-right",
            24,
            "white",
            "black@0.4",
            0.6
          )
        );
      }

      // Custom overlays
      overlays.forEach((overlay) => {
        if (overlay.text) {
          textOverlays.push(
            buildTextOverlay(
              overlay.text,
              overlay.position,
              overlay.fontSize || 48,
              overlay.fontColor || "white",
              overlay.backgroundColor,
              overlay.opacity || 1.0
            )
          );
        }
      });

      // Combine all filters
      // Temporarily disable text overlays to avoid drawtext filter issues
      // TODO: Re-enable when drawtext filter is confirmed available
      const enableTextOverlays = false; // Set to true when drawtext is available
      
      if (enableTextOverlays && textOverlays.length > 0) {
        if (videoFilterChain) {
          videoFilterChain += "," + textOverlays.join(",");
        } else {
          videoFilterChain = textOverlays.join(",");
        }
      }
      
      // Ensure we have at least one filter
      if (!videoFilterChain || videoFilterChain.trim() === "") {
        // Use a simple scale filter as fallback
        const [width, height] = settings.resolution.split("x").map(Number);
        videoFilterChain = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black`;
      }

      // Audio filters: loop audio and fade in/out
      // Use aloop filter for audio (more reliable than stream_loop for audio)
      const audioFilter = `aloop=loop=-1:size=2e+09,afade=t=in:st=0:d=2,afade=t=out:st=${targetDuration - 2}:d=2`;

      // Apply filters
      command
        .videoFilters(videoFilterChain)
        .audioFilters(audioFilter)
        .outputOptions([
          `-t ${targetDuration}`, // Set output duration
          `-c:v libx264`, // Video codec
          `-preset ${settings.preset}`, // Encoding speed/quality
          `-crf ${settings.crf}`, // Quality (lower = better)
          `-b:v ${settings.videoBitrate}`, // Video bitrate
          `-maxrate ${settings.videoBitrate}`, // Max bitrate
          `-bufsize ${parseInt(settings.videoBitrate) * 2}k`, // Buffer size
          `-c:a aac`, // Audio codec
          `-b:a ${settings.audioBitrate}`, // Audio bitrate
          `-ar 44100`, // Audio sample rate
          `-pix_fmt yuv420p`, // Pixel format for compatibility
          `-movflags +faststart`, // Web optimization
        ])
        .output(outputPath)
        .on("start", (commandLine) => {
          console.log(`[Video Composer] 🚀 Starting composition...`);
        })
        .on("progress", (progress) => {
          if (progress.timemark) {
            // Parse time (format: "HH:MM:SS.mmm" or "MM:SS.mmm")
            const timeParts = progress.timemark.split(":").map(Number);
            let currentSeconds = 0;
            if (timeParts.length === 3) {
              // HH:MM:SS format
              currentSeconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
            } else if (timeParts.length === 2) {
              // MM:SS format
              currentSeconds = timeParts[0] * 60 + timeParts[1];
            }
            // Calculate progress based on target duration, not input duration
            const actualPercent = Math.min(100, Math.round((currentSeconds / targetDuration) * 100));
            
            // Update progress tracker if jobId is provided
            if (jobId) {
              updateProgress(jobId, currentSeconds, "generating");
            }
            
            // Only log every 5% to reduce console spam
            if (actualPercent % 5 === 0 || actualPercent === 100) {
              console.log(`[Video Composer] ⏳ Progress: ${actualPercent}% (${formatDuration(currentSeconds)} / ${formatDuration(targetDuration)})`);
            }
          } else if (progress.percent) {
            // Fallback: cap at 100% if using percent
            const cappedPercent = Math.min(100, Math.round(progress.percent));
            const estimatedSeconds = (cappedPercent / 100) * targetDuration;
            
            if (jobId) {
              updateProgress(jobId, estimatedSeconds, "generating");
            }
            
            if (cappedPercent % 5 === 0 || cappedPercent === 100) {
              console.log(`[Video Composer] ⏳ Progress: ${cappedPercent}%`);
            }
          }
        })
        .on("end", async () => {
          try {
            // Get file stats
            const stats = await fs.stat(outputPath);
            const finalDuration = await getVideoDuration(outputPath);

            console.log(`[Video Composer] ✅ Professional video created successfully!`);
            console.log(`[Video Composer] 📁 Output: ${outputPath}`);
            console.log(`[Video Composer] ⏱️  Duration: ${finalDuration}s (${(finalDuration / 60).toFixed(2)} minutes)`);
            console.log(`[Video Composer] 💾 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

            // Mark progress as completed
            if (jobId) {
              completeProgress(jobId, "Video generation completed");
            }

            resolve({
              success: true,
              outputPath,
              duration: finalDuration,
              fileSize: stats.size,
            });
          } catch (error) {
            reject({
              success: false,
              error: `Failed to get output file stats: ${error instanceof Error ? error.message : "Unknown error"}`,
            });
          }
        })
        .on("error", (err) => {
          console.error(`[Video Composer] ❌ Error:`, err);
          
          // Mark progress as error
          if (jobId) {
            errorProgress(jobId, err.message || "Video generation failed");
          }
          reject({
            success: false,
            error: `FFmpeg error: ${err.message}`,
          });
        })
        .run();
    });
  } catch (error) {
    return {
      success: false,
      error: `Video generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Generate video with automatic looping (simpler API)
 */
export async function generateLoopedVideo(
  audioPath: string,
  videoPath: string,
  targetDurationMinutes: number,
  outputPath: string,
  quality: "high" | "medium" | "low" = "high"
): Promise<VideoGenerationResult> {
  const targetDuration = targetDurationMinutes * 60; // Convert to seconds

  // Create temporary asset objects
  const audioAsset: AudioAsset = {
    id: "temp_audio",
    name: "Temporary Audio",
    path: audioPath.replace(process.cwd() + "/public", ""),
    type: "rain",
    loopable: true,
  };

  const visualAsset: VisualAsset = {
    id: "temp_visual",
    name: "Temporary Visual",
    path: videoPath.replace(process.cwd() + "/public", ""),
    type: "rain",
    loopable: true,
    resolution: "1080p",
  };

  return generateVideo({
    audioAsset,
    visualAsset,
    targetDuration,
    outputPath,
    quality,
  });
}

/**
 * Quick function to generate a 30-minute video
 */
export async function generate30MinVideo(
  audioPath: string,
  videoPath: string,
  outputPath: string
): Promise<VideoGenerationResult> {
  return generateLoopedVideo(audioPath, videoPath, 30, outputPath, "high");
}

/**
 * Quick function to generate a 1-hour video
 */
export async function generate1HourVideo(
  audioPath: string,
  videoPath: string,
  outputPath: string
): Promise<VideoGenerationResult> {
  return generateLoopedVideo(audioPath, videoPath, 60, outputPath, "high");
}

/**
 * Quick function to generate an 8-hour video (for sleep content)
 */
export async function generate8HourVideo(
  audioPath: string,
  videoPath: string,
  outputPath: string
): Promise<VideoGenerationResult> {
  return generateLoopedVideo(audioPath, videoPath, 480, outputPath, "medium"); // Use medium quality for 8-hour videos to reduce file size
}

/**
 * Smart asset matching: Matches audio and visual assets by type
 * Ensures rain audio goes with rain visuals, etc.
 */
export function getSmartAssetPair(contentType: string): { audio: AudioAsset; visual: VisualAsset } | null {
  // Get matching pair from asset manager
  const pair = getRandomAssetPair(contentType);
  
  if (!pair) {
    return null;
  }

  return {
    audio: pair.audio,
    visual: pair.visual,
  };
}

/**
 * Create a professional YouTube video with smart asset matching
 * This is the main function to use for creating polished videos
 */
export async function createProfessionalVideo(options: {
  contentType: string; // "rain_sounds", "sleep_sounds", "ambient_sounds", etc.
  title: string;
  subtitle?: string;
  durationMinutes: number;
  outputPath: string;
  quality?: "high" | "medium" | "low";
  showWatermark?: boolean;
  showDuration?: boolean;
  colorGrading?: "warm" | "cool" | "natural" | "cinematic";
  jobId?: string; // Optional job ID for progress tracking
}): Promise<VideoGenerationResult> {
  const {
    contentType,
    title,
    subtitle,
    durationMinutes,
    outputPath,
    quality = "high",
    showWatermark = false,
    showDuration = true,
    colorGrading = "natural",
    jobId,
  } = options;

  // Get smart asset pair
  const assetPair = getSmartAssetPair(contentType);
  
  if (!assetPair) {
    return {
      success: false,
      error: `No matching assets found for content type: ${contentType}`,
    };
  }

  // Determine color grading based on content type
  let finalColorGrading = colorGrading;
  if (colorGrading === "natural") {
    if (contentType.includes("rain") || contentType.includes("sleep")) {
      finalColorGrading = "cool";
    } else if (contentType.includes("ambient") || contentType.includes("nature")) {
      finalColorGrading = "warm";
    }
  }

  // Create professional video
  return generateVideo({
    audioAsset: assetPair.audio,
    visualAsset: assetPair.visual,
    targetDuration: durationMinutes * 60,
    outputPath,
    quality,
    title,
    subtitle,
    showWatermark,
    showDuration,
    fadeIn: true,
    fadeOut: true,
    colorGrading: finalColorGrading,
    jobId,
  });
}

/**
 * Create a professional sleep video (8 hours)
 */
export async function createSleepVideo(
  title: string,
  outputPath: string,
  showWatermark: boolean = false,
  jobId?: string
): Promise<VideoGenerationResult> {
  return createProfessionalVideo({
    contentType: "sleep_sounds",
    title,
    subtitle: "8 Hours of Relaxing Sleep Sounds",
    durationMinutes: 480, // 8 hours
    outputPath,
    quality: "medium", // Medium quality for large files
    showWatermark,
    showDuration: true,
    colorGrading: "cool",
    jobId,
  });
}

/**
 * Create a professional rain sounds video (30 minutes to 8 hours)
 */
export async function createRainVideo(
  title: string,
  durationMinutes: number,
  outputPath: string,
  showWatermark: boolean = false,
  jobId?: string
): Promise<VideoGenerationResult> {
  return createProfessionalVideo({
    contentType: "rain_sounds",
    title,
    subtitle: `Perfect for Sleep, Study & Relaxation`,
    durationMinutes,
    outputPath,
    quality: durationMinutes > 120 ? "medium" : "high",
    showWatermark,
    showDuration: true,
    colorGrading: "cool",
    jobId,
  });
}

/**
 * Create a professional ambient/nature video
 */
export async function createAmbientVideo(
  title: string,
  durationMinutes: number,
  outputPath: string,
  showWatermark: boolean = false,
  jobId?: string
): Promise<VideoGenerationResult> {
  return createProfessionalVideo({
    contentType: "ambient_sounds",
    title,
    subtitle: "Nature Sounds for Focus & Relaxation",
    durationMinutes,
    outputPath,
    quality: durationMinutes > 120 ? "medium" : "high",
    showWatermark,
    jobId,
    showDuration: true,
    colorGrading: "warm",
  });
}
