/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  // Compress output
  compress: true,
  // Optimize production builds
  swcMinify: true,
  // Enable React strict mode for better performance
  reactStrictMode: true,
  // Optimize fonts
  optimizeFonts: true,

  /**
   * /pricing and /features were standalone pages duplicating sections the
   * landing page already has (#pricing, #features), in the older purple design —
   * so the marketing site contradicted itself depending on the route taken.
   *
   * Redirects rather than deletion: nine places still link to /pricing as the
   * upgrade destination (dashboard credit/payment banners, UsageDashboard,
   * onboarding, checkout's "Back to pricing"), and both URLs were listed in
   * sitemap.xml, so they may be indexed. The anchors land on the same content
   * and the same /checkout?plan= route, so nothing is lost.
   */
  async redirects() {
    return [
      { source: "/pricing", destination: "/#pricing", permanent: true },
      { source: "/features", destination: "/#features", permanent: true },
    ];
  },
};

export default nextConfig;
