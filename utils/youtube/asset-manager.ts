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

// Asset library - Updated with actual files found
export const audioAssets: AudioAsset[] = [
  // Rain sounds (actual files found)
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
    id: "rain_heavy_2",
    name: "Heavy Rain Loop 2",
    path: "/assets/audio/background/rain/rain_heavy_2.flac",
    type: "rain",
    loopable: true,
  },
  {
    id: "rain_light_2",
    name: "Light Rain Loop 2",
    path: "/assets/audio/background/rain/rain_light_2.flac",
    type: "rain",
    loopable: true,
  },
  {
    id: "rain_extraheavy_light_1",
    name: "Extra Heavy/Light Rain",
    path: "/assets/audio/background/rain/rain_extraheavy:light_1.flac",
    type: "rain",
    loopable: true,
  },
  // Sleep/White Noise (actual files found)
  {
    id: "white_noise_1",
    name: "White Noise",
    path: "/assets/audio/background/sleep/white_noise.wav",
    type: "white_noise",
    loopable: true,
  },
  {
    id: "whitenoise2",
    name: "White Noise 2",
    path: "/assets/audio/background/sleep/whitenoise2.wav",
    type: "white_noise",
    loopable: true,
  },
  {
    id: "white_noise_flac",
    name: "White Noise FLAC",
    path: "/assets/audio/background/sleep/white_noise",
    type: "white_noise",
    loopable: true,
  },
  {
    id: "thunderstorm_1",
    name: "Thunderstorm",
    path: "/assets/audio/background/sleep/thunderstorm.mp3",
    type: "sleep",
    loopable: true,
  },
  {
    id: "thunderstorm2",
    name: "Thunderstorm 2",
    path: "/assets/audio/background/sleep/thunderstorm2.mp3",
    type: "sleep",
    loopable: true,
  },
  {
    id: "thunderstorm3",
    name: "Thunderstorm 3",
    path: "/assets/audio/background/sleep/thunderstorm3.mp3",
    type: "sleep",
    loopable: true,
  },
  // Ambient sounds (actual files found)
  {
    id: "ocean_waves_1",
    name: "Ocean Waves",
    path: "/assets/audio/background/ambient/ocean_waves.wav",
    type: "ambient",
    loopable: true,
  },
  {
    id: "ocean_waves2",
    name: "Ocean Waves 2",
    path: "/assets/audio/background/ambient/ocean_waves2.wav",
    type: "ambient",
    loopable: true,
  },
];

export const visualAssets: VisualAsset[] = [
  // Rain videos (actual files)
  {
    id: "rain_window_classic",
    name: "Rain on Window (Classic Sleeper)",
    path: "/assets/visuals/backgrounds/rain/Rainonwindow(classic sleeper).mp4",
    type: "rain",
    loopable: true,
    resolution: "1080p",
  },
  {
    id: "forest_rain_deep",
    name: "Forest Rain (Deep Calm)",
    path: "/assets/visuals/backgrounds/rain/Forestrain(deep calm).mp4",
    type: "rain",
    loopable: true,
    resolution: "1080p",
  },
  {
    id: "rainy_day_neutral",
    name: "Rainy Day Background (Neutral Loop)",
    path: "/assets/visuals/backgrounds/rain/Rainydaybackground(neutral loop).mp4",
    type: "rain",
    loopable: true,
    resolution: "1080p",
  },
  // Nature videos (actual files)
  {
    id: "ocean_waves_monetizable",
    name: "Ocean Waves (Most Monetizable)",
    path: "/assets/visuals/backgrounds/nature/Oceanwaves(most monetizable).mp4",
    type: "nature",
    loopable: true,
    resolution: "1080p",
  },
  {
    id: "forest_nature_ambient",
    name: "Forest Nature (Ambient)",
    path: "/assets/visuals/backgrounds/nature/Forestnature ambient).mp4",
    type: "nature",
    loopable: true,
    resolution: "1080p",
  },
  {
    id: "calm_landscape_neutral",
    name: "Calm Landscape (Neutral Background)",
    path: "/assets/visuals/backgrounds/nature/Calmlandscape(neutral background).mp4",
    type: "nature",
    loopable: true,
    resolution: "1080p",
  },
  // Abstract videos (actual files)
  {
    id: "smooth_gradient_white_noise",
    name: "Smooth Gradient Loop (Best for White Noise)",
    path: "/assets/visuals/backgrounds/abstract/Smoothgradientloop(best for white noise).mp4",
    type: "abstract",
    loopable: true,
    resolution: "1080p",
  },
  {
    id: "colorwaves_premium",
    name: "Color Waves (Premium Look)",
    path: "/assets/visuals/backgrounds/abstract/Colorwaves(premium look).mp4",
    type: "abstract",
    loopable: true,
    resolution: "1080p",
  },
  {
    id: "particle_motion_background",
    name: "Particle Motion Background",
    path: "/assets/visuals/backgrounds/abstract/Particlemotionbackground.mp4",
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
