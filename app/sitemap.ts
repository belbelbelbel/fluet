import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.getrevvy.pro";

/**
 * Served at /sitemap.xml. Public marketing pages only — every authed or
 * token-bearing route is excluded here and in robots.ts.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  // /pricing and /features are gone — they now 308 to the landing anchors, and a
  // sitemap must not advertise redirects.
  return [
    { url: SITE_URL, lastModified, changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE_URL}/docs`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
