export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  contentType: "twitter" | "instagram" | "linkedin" | "tiktok";
  tone?: "professional" | "casual" | "funny" | "inspiring" | "educational";
  style?: "concise" | "detailed" | "storytelling" | "list-based";
}

export const contentTemplates: ContentTemplate[] = [
  {
    id: "twitter-tech-thread",
    name: "Tech Product Launch",
    description: "Create an engaging Twitter thread for a tech product launch",
    prompt: "A Twitter thread announcing a new tech product launch. Include key features, benefits, and a call to action.",
    contentType: "twitter",
    tone: "professional",
    style: "list-based",
  },
  {
    id: "instagram-lifestyle",
    name: "Lifestyle Post",
    description: "Perfect for lifestyle and personal brand content",
    prompt: "An Instagram caption for a lifestyle post. Make it engaging, relatable, and include relevant hashtags.",
    contentType: "instagram",
    tone: "casual",
    style: "storytelling",
  },
  {
    id: "linkedin-thought-leadership",
    name: "Thought Leadership",
    description: "Professional LinkedIn post for establishing expertise",
    prompt: "A LinkedIn post sharing insights and thought leadership on a professional topic. Include key takeaways and engage the professional community.",
    contentType: "linkedin",
    tone: "professional",
    style: "detailed",
  },
  {
    id: "tiktok-trending",
    name: "Trending Topic",
    description: "Viral-worthy TikTok content script",
    prompt: "A TikTok video script about a trending topic. Include a hook, engaging body content, and a call to action.",
    contentType: "tiktok",
    tone: "funny",
    style: "concise",
  },
  {
    id: "twitter-tips",
    name: "Tips & Tricks Thread",
    description: "Educational Twitter thread with actionable tips",
    prompt: "A Twitter thread sharing tips and tricks on a specific topic. Make it educational and valuable for the audience.",
    contentType: "twitter",
    tone: "educational",
    style: "list-based",
  },
  {
    id: "instagram-motivation",
    name: "Motivational Post",
    description: "Inspiring Instagram caption to motivate your audience",
    prompt: "An inspiring Instagram caption that motivates and uplifts the audience. Include a powerful message and relevant hashtags.",
    contentType: "instagram",
    tone: "inspiring",
    style: "storytelling",
  },
];






