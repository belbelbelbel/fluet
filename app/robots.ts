import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.getrevvy.pro";

/**
 * Served at /robots.txt.
 *
 * The disallow list is not only about crawl budget. /client-portal/<token> and
 * /invite/<token> ARE the credential — the token in the path is what grants
 * access. If either is ever linked from an indexable page, a crawler could put
 * a live approval link into search results. Keeping them out of the index is a
 * cheap second line of defence behind the email-code verification.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/client/",
          "/client-portal/",
          "/checkout/",
          "/invite/",
          "/sign-in",
          "/sign-up",
          "/clear-session",
          "/oauth2callback",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
