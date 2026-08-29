import type { MetadataRoute } from "next";

/**
 * Served at /manifest.webmanifest, the path referenced by metadata.manifest
 * in app/layout.tsx. Lets the dashboard be installed to a phone home screen.
 *
 * No "maskable" icon is declared on purpose: maskable icons are cropped to a
 * circle/squircle and ours have no safe-area padding, so the wordmark would
 * lose its edges. Better a correctly-sized "any" icon than a clipped one.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Revvy. Client approvals without the chasing",
    short_name: "Revvy",
    description:
      "One link where clients review, approve, and schedule, so nothing goes out unapproved.",
    // "/" rather than "/dashboard": a launch straight into an authed route
    // bounces through sign-in, which is a poor first impression from an icon tap.
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/images/Revvylogo/logo-favicon.png",
        sizes: "64x64",
        type: "image/png",
      },
      {
        src: "/images/Revvylogo/logo-icon.png",
        sizes: "500x500",
        type: "image/png",
      },
      {
        src: "/images/Revvylogo/logo-2-square.png",
        sizes: "800x800",
        type: "image/png",
      },
    ],
  };
}
