/**
 * YouTube Asset Manager
 * Manages audio and visual assets for video generation
 */

export interface AudioAsset {
  id: string;
  name: string;
  path: string;
  type: "rain" | "ambient" | "sleep" | "white_noise" | "voice";
  duration?: number; // in seconds, for looping
  loopable: boolean;
}

export interface VisualAsset {
  id: string;
  name: string;
  path: string;
  type: "rain" | "nature" | "abstract" | "template";
  loopable: boolean;
  resolution: "1080p" | "720p" | "4k";
}

export interface AssetPair {
  audio: AudioAsset;
  visual: VisualAsset;
  template: string;
}

// Asset library (will be populated from actual assets)
export const audioAssets: AudioAsset[] = [
  // Placeholder - will be replaced with actual assets
  {
    id: "rain_heavy_1",
    name: "Heavy Rain Loop",
    path: "/assets/audio/background/rain/rain_heavy_1.wav",
    type: "rain",
    loopable: true,
  },
  {
    id: "rain_light_1",
    name: "Light Rain Loop",
    path: "/assets/audio/background/rain/rain_light_1.wav",
    type: "rain",
    loopable: true,
  },
  {
    id: "white_noise_1",
    name: "White Noise",
    path: "/assets/audio/background/sleep/white_noise.wav",
    type: "white_noise",
    loopable: true,
  },
  {
    id: "ocean_waves_1",
    name: "Ocean Waves",
    path: "/assets/audio/background/ambient/ocean_waves.wav",
    type: "ambient",
    loopable: true,
  },
  {
    id: "thunderstorm_1",
    name: "Thunderstorm",
    path: "/assets/audio/background/sleep/thunderstorm.wav",
    type: "sleep",
    loopable: true,
  },
];

export const visualAssets: VisualAsset[] = [
  // Placeholder - will be replaced with actual assets
  {
    id: "rain_window_1",
    name: "Rain on Window",
    path: "/assets/visuals/backgrounds/rain/rain_window_1.mp4",
    type: "rain",
    loopable: true,
    resolution: "1080p",
  },
  {
    id: "forest_rain_1",
    name: "Forest Rain",
    path: "/assets/visuals/backgrounds/rain/forest_rain_1.mp4",
    type: "rain",
    loopable: true,
    resolution: "1080p",
  },
  {
    id: "ocean_visual_1",
    name: "Ocean Waves",
    path: "/assets/visuals/backgrounds/nature/ocean_visual_1.mp4",
    type: "nature",
    loopable: true,
    resolution: "1080p",
  },
  {
    id: "abstract_1",
    name: "Abstract Background",
    path: "/assets/visuals/backgrounds/abstract/gradient_1.mp4",
    type: "abstract",
    loopable: true,
    resolution: "1080p",
  },
];

/**
 * Get audio asset by ID
 */
export function getAudioAsset(id: string): AudioAsset | undefined {
  return audioAssets.find(asset => asset.id === id);
}

/**
 * Get visual asset by ID
 */
export function getVisualAsset(id: string): VisualAsset | undefined {
  return visualAssets.find(asset => asset.id === id);
}

/**
 * Get random asset pair for content type
 */
export function getRandomAssetPair(contentType: string): AssetPair | null {
  // Filter assets by content type
  let matchingAudio = audioAssets;
  let matchingVisual = visualAssets;
  
  if (contentType.includes("rain")) {
    matchingAudio = audioAssets.filter(a => a.type === "rain");
    matchingVisual = visualAssets.filter(v => v.type === "rain");
  } else if (contentType.includes("sleep") || contentType.includes("white_noise")) {
    matchingAudio = audioAssets.filter(a => a.type === "sleep" || a.type === "white_noise");
    matchingVisual = visualAssets.filter(v => v.type === "abstract" || v.type === "nature");
  } else if (contentType.includes("ambient")) {
    matchingAudio = audioAssets.filter(a => a.type === "ambient");
    matchingVisual = visualAssets.filter(v => v.type === "nature");
  }
  
  if (matchingAudio.length === 0 || matchingVisual.length === 0) {
    return null;
  }
  
  const randomAudio = matchingAudio[Math.floor(Math.random() * matchingAudio.length)];
  const randomVisual = matchingVisual[Math.floor(Math.random() * matchingVisual.length)];
  
  // Determine template based on content type
  let template = "sleep_template";
  if (contentType.includes("facts") || contentType.includes("educational")) {
    template = "facts_template";
  } else if (contentType.includes("ambient")) {
    template = "ambient_template";
  }
  
  return {
    audio: randomAudio,
    visual: randomVisual,
    template,
  };
}

/**
 * Get asset pair by IDs
 */
export function getAssetPair(audioId: string, visualId: string): AssetPair | null {
  const audio = getAudioAsset(audioId);
  const visual = getVisualAsset(visualId);
  
  if (!audio || !visual) {
    return null;
  }
  
  return {
    audio,
    visual,
    template: "sleep_template", // Default, can be customized
  };
}
