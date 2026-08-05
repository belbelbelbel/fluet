/**
 * Reference mock data generators — NOT used in production UI.
 *
 * Kept for future analytics prototyping and as documentation of what was
 * previously shown as fake metrics. Dashboard and analytics pages now gate
 * engagement/geo/social metrics behind honest "coming soon" states instead.
 */

/** Previously used for dashboard engagement line chart (Jul–Dec sample data). */
export const MOCK_DASHBOARD_ENGAGEMENT_CHART = [
  { month: "Jul", Facebook: 45, Instagram: 38, LinkedIn: 32 },
  { month: "Aug", Facebook: 48, Instagram: 42, LinkedIn: 35 },
  { month: "Sep", Facebook: 52, Instagram: 45, LinkedIn: 38 },
  { month: "Oct", Facebook: 50, Instagram: 48, LinkedIn: 40 },
  { month: "Nov", Facebook: 55, Instagram: 52, LinkedIn: 42 },
  { month: "Dec", Facebook: 58, Instagram: 55, LinkedIn: 45 },
];

/** Previously used for dashboard geography breakdown. */
export const MOCK_TOP_GEOGRAPHIES = [
  { country: "Lagos, Nigeria", rate: 65.1 },
  { country: "Abuja, Nigeria", rate: 50.5 },
  { country: "Port Harcourt, Nigeria", rate: 39.2 },
  { country: "Ibadan, Nigeria", rate: 9.2 },
];

/** Previously used for dashboard comments feed. */
export const MOCK_COMMENTS = [
  {
    name: "Amina Okafor",
    handle: "@amina_social",
    location: "Lagos, Nigeria",
    time: "31 Jan 12.30 AM",
    avatar: "A",
  },
  {
    name: "Chukwu Emeka",
    handle: "@chukwu_digital",
    location: "Abuja, Nigeria",
    time: "30 Jan 3.45 PM",
    avatar: "C",
  },
  {
    name: "Fatima Bello",
    handle: "@fatima_media",
    location: "Port Harcourt, Nigeria",
    time: "30 Jan 11.20 AM",
    avatar: "F",
  },
];

/** Previously returned by /api/analytics as fake daily performance. */
export function generateMockRecentPerformance(days = 7) {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    return {
      date: date.toISOString().split("T")[0],
      views: Math.floor(Math.random() * 1000) + 100,
      engagement: Math.floor(Math.random() * 10) + 3,
    };
  });
}

/** Previously used by /api/dashboard/stats for fake engagement rate. */
export function generateMockEngagementRate(totalContent: number): number {
  return totalContent > 0 ? Math.floor(Math.random() * 10) + 5 : 0;
}

/** Previously returned by /api/clients/[id]/analytics for engagement sections. */
export function generateMockClientEngagementAnalytics(postedCount: number) {
  return {
    totalEngagement: postedCount * 150,
    averageEngagementRate: 4.2,
    topPlatform: "instagram",
    engagementGrowth: 12.5,
    topPerformingPost:
      postedCount > 0
        ? {
            engagementRate: 6.8,
          }
        : null,
    platformBreakdown: [
      { platform: "instagram", posts: 5, engagement: 750, engagementRate: 5.2 },
      { platform: "twitter", posts: 3, engagement: 320, engagementRate: 3.8 },
      { platform: "linkedin", posts: 2, engagement: 180, engagementRate: 4.5 },
    ],
    monthlyTrend: [
      { month: "Jan", posts: 8, engagement: 1200 },
      { month: "Feb", posts: 12, engagement: 1800 },
      { month: "Mar", posts: 15, engagement: 2400 },
    ],
  };
}
