// YouTube Content Ideas Database
// Focus: Faceless content for worldwide audience
// Niches: Rain/Ambient sounds, Facts/Educational, Sleep/Relaxation

export type YouTubeContentType = 
  | "rain_sounds"
  | "ambient_sounds"
  | "sleep_sounds"
  | "facts_educational"
  | "relaxation"
  | "white_noise";

export type YouTubeVideoFormat = 
  | "long_form" // 1-8 hours
  | "shorts"; // Under 60 seconds

export interface YouTubeContentIdea {
  id: string;
  type: YouTubeContentType;
  title: string;
  description: string;
  tags: string[];
  duration: "short" | "medium" | "long"; // 1-3 hours, 3-6 hours, 6-8 hours
  format: YouTubeVideoFormat;
  audioAsset?: string; // Reference to audio asset
  visualAsset?: string; // Reference to visual asset
  template?: string; // Template to use
  seoKeywords: string[];
  category: string; // YouTube category
}

// Initial YouTube content ideas (10-20 to start)
export const youtubeContentIdeas: YouTubeContentIdea[] = [
  // Rain Sounds
  {
    id: "yt_rain_1",
    type: "rain_sounds",
    title: "Heavy Rain Sounds for Deep Sleep - 8 Hours | Rain on Window",
    description: "Experience the calming sound of heavy rain falling on a window. Perfect for deep sleep, meditation, studying, or relaxation. This 8-hour loop features high-quality rain sounds that will help you fall asleep faster and stay asleep longer.\n\n🌧️ Benefits:\n- Promotes deep sleep\n- Reduces stress and anxiety\n- Improves focus and concentration\n- Creates peaceful atmosphere\n\nPerfect for:\n- Sleeping\n- Studying\n- Meditation\n- Relaxation\n- Background ambience\n\n#RainSounds #SleepSounds #Relaxation #ASMR #WhiteNoise #StudySounds #Meditation",
    tags: ["rain sounds", "sleep sounds", "relaxation", "ASMR", "white noise", "study sounds", "meditation", "deep sleep", "rain on window"],
    duration: "long",
    format: "long_form",
    audioAsset: "rain_heavy_1",
    visualAsset: "rain_window_1",
    template: "sleep_template",
    seoKeywords: ["rain sounds", "sleep sounds", "relaxation", "ASMR", "white noise"],
    category: "Music"
  },
  {
    id: "yt_rain_2",
    type: "rain_sounds",
    title: "Light Rain in Forest - Meditation & Focus - 5 Hours",
    description: "Immerse yourself in the gentle sound of light rain falling in a peaceful forest. This 5-hour ambient soundscape is perfect for meditation, focus, studying, or simply relaxing.\n\n🌲 Features:\n- Natural forest ambience\n- Light rain sounds\n- High-quality audio\n- Seamless loop\n\nIdeal for:\n- Meditation\n- Studying\n- Work focus\n- Relaxation\n- Background ambience\n\n#RainSounds #ForestSounds #Meditation #StudySounds #NatureSounds #Relaxation",
    tags: ["rain sounds", "forest sounds", "meditation", "study sounds", "nature sounds", "relaxation", "focus", "ambient"],
    duration: "medium",
    format: "long_form",
    audioAsset: "rain_light_1",
    visualAsset: "forest_rain_1",
    template: "ambient_template",
    seoKeywords: ["rain sounds", "forest sounds", "meditation", "nature sounds"],
    category: "Music"
  },
  {
    id: "yt_rain_3",
    type: "rain_sounds",
    title: "Thunderstorm Sounds - Sleep & Relaxation - 6 Hours",
    description: "Powerful thunderstorm sounds with heavy rain and distant thunder. Perfect for deep sleep, relaxation, or creating a cozy atmosphere. This 6-hour loop will help you unwind and fall asleep naturally.\n\n⛈️ Features:\n- Heavy rain\n- Distant thunder\n- Deep, rumbling sounds\n- High-quality audio\n\nPerfect for:\n- Deep sleep\n- Relaxation\n- Cozy atmosphere\n- Stress relief\n\n#Thunderstorm #RainSounds #SleepSounds #Relaxation #ASMR #StormSounds",
    tags: ["thunderstorm", "rain sounds", "sleep sounds", "relaxation", "ASMR", "storm sounds", "thunder", "heavy rain"],
    duration: "medium",
    format: "long_form",
    audioAsset: "thunderstorm_1",
    visualAsset: "storm_visual_1",
    template: "sleep_template",
    seoKeywords: ["thunderstorm", "rain sounds", "sleep sounds", "storm sounds"],
    category: "Music"
  },

  // Ambient Sounds
  {
    id: "yt_ambient_1",
    type: "ambient_sounds",
    title: "Ocean Waves - Relaxation & Sleep - 4 Hours",
    description: "Calming ocean waves crashing on the shore. This 4-hour ambient soundscape is perfect for relaxation, sleep, meditation, or as background noise for work and study.\n\n🌊 Benefits:\n- Promotes relaxation\n- Reduces stress\n- Improves sleep quality\n- Enhances focus\n\n#OceanWaves #Relaxation #SleepSounds #Meditation #NatureSounds #ASMR",
    tags: ["ocean waves", "relaxation", "sleep sounds", "meditation", "nature sounds", "ASMR", "beach sounds", "water sounds"],
    duration: "short",
    format: "long_form",
    audioAsset: "ocean_waves_1",
    visualAsset: "ocean_visual_1",
    template: "relaxation_template",
    seoKeywords: ["ocean waves", "relaxation", "sleep sounds", "nature sounds"],
    category: "Music"
  },
  {
    id: "yt_ambient_2",
    type: "ambient_sounds",
    title: "Forest Ambience - Nature Sounds - 3 Hours",
    description: "Peaceful forest ambience with birds chirping and gentle nature sounds. Perfect for meditation, studying, or creating a calm atmosphere.\n\n🌲 Features:\n- Natural forest sounds\n- Bird sounds\n- Gentle ambience\n- High-quality recording\n\n#ForestSounds #NatureSounds #Meditation #StudySounds #Relaxation #Ambient",
    tags: ["forest sounds", "nature sounds", "meditation", "study sounds", "relaxation", "ambient", "bird sounds", "nature ambience"],
    duration: "short",
    format: "long_form",
    audioAsset: "forest_ambience_1",
    visualAsset: "forest_visual_1",
    template: "ambient_template",
    seoKeywords: ["forest sounds", "nature sounds", "meditation", "ambient"],
    category: "Music"
  },

  // Sleep Sounds
  {
    id: "yt_sleep_1",
    type: "sleep_sounds",
    title: "White Noise for Deep Sleep - 8 Hours | Block Out Noise",
    description: "Pure white noise for deep, uninterrupted sleep. This 8-hour loop will help block out distracting sounds and help you fall asleep faster.\n\n🔇 Benefits:\n- Blocks out noise\n- Promotes deep sleep\n- Reduces distractions\n- Improves sleep quality\n\nPerfect for:\n- Light sleepers\n- City dwellers\n- Shift workers\n- Anyone needing better sleep\n\n#WhiteNoise #SleepSounds #DeepSleep #BlockNoise #Relaxation #ASMR",
    tags: ["white noise", "sleep sounds", "deep sleep", "block noise", "relaxation", "ASMR", "sleep aid", "noise blocking"],
    duration: "long",
    format: "long_form",
    audioAsset: "white_noise_1",
    visualAsset: "abstract_1",
    template: "sleep_template",
    seoKeywords: ["white noise", "sleep sounds", "deep sleep", "block noise"],
    category: "Music"
  },
  {
    id: "yt_sleep_2",
    type: "sleep_sounds",
    title: "Fireplace Crackling - Cozy Ambience - 3 Hours",
    description: "Relaxing fireplace crackling sounds. Perfect for creating a cozy, warm atmosphere for sleep, relaxation, or work.\n\n🔥 Features:\n- Realistic fireplace sounds\n- Cozy ambience\n- High-quality audio\n- Seamless loop\n\n#Fireplace #Cozy #Relaxation #SleepSounds #Ambience #ASMR",
    tags: ["fireplace", "cozy", "relaxation", "sleep sounds", "ambience", "ASMR", "fire sounds", "warm sounds"],
    duration: "short",
    format: "long_form",
    audioAsset: "fireplace_1",
    visualAsset: "fireplace_visual_1",
    template: "relaxation_template",
    seoKeywords: ["fireplace", "cozy", "relaxation", "sleep sounds"],
    category: "Music"
  },

  // Facts/Educational
  {
    id: "yt_facts_1",
    type: "facts_educational",
    title: "10 Amazing Facts About Space You Didn't Know",
    description: "Discover 10 mind-blowing facts about space that will leave you amazed! From black holes to distant galaxies, learn fascinating information about our universe.\n\n🚀 Topics Covered:\n- Black holes\n- Galaxies\n- Planets\n- Stars\n- Space exploration\n\nSubscribe for more educational content!\n\n#SpaceFacts #Educational #Science #Astronomy #Facts #Learning #Space",
    tags: ["space facts", "educational", "science", "astronomy", "facts", "learning", "space", "universe", "planets"],
    duration: "short",
    format: "shorts",
    audioAsset: "voice_facts_1",
    visualAsset: "space_facts_1",
    template: "facts_template",
    seoKeywords: ["space facts", "educational", "science", "astronomy"],
    category: "Education"
  },
  {
    id: "yt_facts_2",
    type: "facts_educational",
    title: "The History of the World's Tallest Buildings",
    description: "Explore the fascinating history of the world's tallest buildings, from ancient structures to modern skyscrapers. Learn about the engineering marvels that have shaped our skylines.\n\n🏗️ Topics Covered:\n- Ancient wonders\n- Modern skyscrapers\n- Engineering feats\n- Architectural history\n\n#TallestBuildings #History #Architecture #Educational #Facts #Engineering",
    tags: ["tallest buildings", "history", "architecture", "educational", "facts", "engineering", "skyscrapers", "construction"],
    duration: "short",
    format: "shorts",
    audioAsset: "voice_facts_1",
    visualAsset: "buildings_visual_1",
    template: "educational_template",
    seoKeywords: ["tallest buildings", "history", "architecture", "educational"],
    category: "Education"
  },
  {
    id: "yt_facts_3",
    type: "facts_educational",
    title: "Fascinating Animal Facts - Part 1",
    description: "Discover incredible facts about animals that will surprise you! From the smallest creatures to the largest, learn amazing information about the animal kingdom.\n\n🐾 Topics Covered:\n- Animal behavior\n- Unique abilities\n- Interesting facts\n- Wildlife\n\n#AnimalFacts #Educational #Wildlife #Facts #Animals #Learning #Nature",
    tags: ["animal facts", "educational", "wildlife", "facts", "animals", "learning", "nature", "biology", "zoology"],
    duration: "short",
    format: "shorts",
    audioAsset: "voice_facts_1",
    visualAsset: "animals_visual_1",
    template: "facts_template",
    seoKeywords: ["animal facts", "educational", "wildlife", "facts"],
    category: "Education"
  },
  {
    id: "yt_facts_4",
    type: "facts_educational",
    title: "Mind-Blowing Science Facts Explained",
    description: "Explore mind-blowing science facts that will change how you see the world! From quantum physics to biology, discover fascinating scientific discoveries.\n\n🔬 Topics Covered:\n- Physics\n- Chemistry\n- Biology\n- Quantum mechanics\n\n#ScienceFacts #Educational #Science #Facts #Learning #Physics #Chemistry",
    tags: ["science facts", "educational", "science", "facts", "learning", "physics", "chemistry", "biology", "quantum"],
    duration: "short",
    format: "shorts",
    audioAsset: "voice_facts_1",
    visualAsset: "science_visual_1",
    template: "educational_template",
    seoKeywords: ["science facts", "educational", "science", "facts"],
    category: "Education"
  },
];

// Get YouTube content ideas by type
export function getYouTubeContentIdeas(
  type?: YouTubeContentType,
  limit?: number
): YouTubeContentIdea[] {
  let ideas = youtubeContentIdeas;
  
  if (type) {
    ideas = ideas.filter(idea => idea.type === type);
  }
  
  if (limit) {
    ideas = ideas.slice(0, limit);
  }
  
  return ideas;
}

// Get random YouTube content idea
export function getRandomYouTubeIdea(): YouTubeContentIdea {
  const randomIndex = Math.floor(Math.random() * youtubeContentIdeas.length);
  return youtubeContentIdeas[randomIndex];
}

// Get YouTube content ideas by format
export function getYouTubeIdeasByFormat(format: YouTubeVideoFormat): YouTubeContentIdea[] {
  return youtubeContentIdeas.filter(idea => idea.format === format);
}
