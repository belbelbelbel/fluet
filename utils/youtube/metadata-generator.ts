/**
 * YouTube Metadata Generator
 * Generates SEO-optimized titles, descriptions, and tags for YouTube videos
 */

import { YouTubeContentIdea } from "@/lib/youtube-content-ideas";

export interface YouTubeMetadata {
  title: string;
  description: string;
  tags: string[];
  category: string;
  defaultLanguage: string;
  privacyStatus: "public" | "unlisted" | "private";
}

/**
 * Generate YouTube metadata from content idea
 */
export function generateYouTubeMetadata(
  idea: YouTubeContentIdea,
  customTitle?: string,
  customDescription?: string
): YouTubeMetadata {
  return {
    title: customTitle || idea.title,
    description: customDescription || idea.description,
    tags: idea.tags,
    category: idea.category,
    defaultLanguage: "en",
    privacyStatus: "public", // Can be made configurable
  };
}

/**
 * Generate SEO-optimized title variations
 */
export function generateTitleVariations(baseTitle: string): string[] {
  const variations: string[] = [baseTitle];
  
  // Add duration if not present
  if (!baseTitle.includes("Hours") && !baseTitle.includes("hours")) {
    variations.push(`${baseTitle} - 8 Hours`);
  }
  
  // Add benefits
  if (baseTitle.includes("Sleep")) {
    variations.push(`${baseTitle} | Deep Sleep & Relaxation`);
  }
  
  if (baseTitle.includes("Study") || baseTitle.includes("Focus")) {
    variations.push(`${baseTitle} | Study & Concentration`);
  }
  
  return variations;
}

/**
 * Generate description with SEO optimization
 */
export function enhanceDescription(
  baseDescription: string,
  keywords: string[]
): string {
  // Add keywords naturally to description
  let enhanced = baseDescription;
  
  // Add keyword-rich footer
  const keywordFooter = `\n\nKeywords: ${keywords.join(", ")}`;
  enhanced += keywordFooter;
  
  return enhanced;
}

/**
 * Generate tags from keywords and content type
 */
export function generateTags(
  baseTags: string[],
  keywords: string[],
  contentType: string
): string[] {
  const allTags = [...baseTags, ...keywords];
  
  // Add content type specific tags
  if (contentType.includes("sleep")) {
    allTags.push("sleep aid", "insomnia", "sleep meditation");
  }
  
  if (contentType.includes("study")) {
    allTags.push("study music", "focus music", "concentration");
  }
  
  if (contentType.includes("rain")) {
    allTags.push("rain", "rainfall", "rainy day");
  }
  
  // Remove duplicates and limit to 50 (YouTube limit)
  return Array.from(new Set(allTags)).slice(0, 50);
}
