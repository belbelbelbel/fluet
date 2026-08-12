import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Fraunces } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemeToaster } from "@/components/ThemeToaster";
import { GlobalErrorHandler } from "@/components/GlobalErrorHandler";
import "./globals.css";

const nunito = localFont({
  src: [
    {
      path: "./fonts/Nunito/Nunito-VariableFont_wght.ttf",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "./fonts/Nunito/Nunito-Italic-VariableFont_wght.ttf",
      weight: "100 900",
      style: "italic",
    },
  ],
  variable: "--font-nunito",
  display: "swap",
});

/**
 * Landing-page type system. Scoped to marketing pages via `.landing` in
 * globals.css so the dashboard keeps Nunito untouched.
 *
 * Fraunces carries the editorial voice; Geist does the UI work; Geist Mono
 * labels the technical detail. Fraunces is variable across 100–900, so headings
 * can sit at 600–700 with real presence — Instrument Serif only shipped a 400
 * and read too thin at display sizes.
 */
// No `weight` here on purpose: naming weights requests static instances, and
// `axes` is only valid on the variable font. Omitting it loads the full 100–900
// range, which is what lets the headings sit at 600.
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-display",
  display: "swap",
});

const geist = localFont({
  src: "./fonts/GeistVF.woff",
  weight: "100 900",
  variable: "--font-geist",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  weight: "100 900",
  variable: "--font-geist-mono",
  display: "swap",
});

const SITE_NAME = "Revvy";
const SITE_TITLE = "Revvy — Client approvals, without the chasing";
const SITE_DESCRIPTION =
  "Revvy gives your agency one link where clients review, approve, and schedule — so nothing goes out unapproved. Built for agencies managing 3–10 clients.";

/**
 * Canonical origin. metadataBase is what turns the relative image paths below
 * into the absolute URLs that scrapers require — without it Next emits relative
 * og:image values and every social preview silently renders blank.
 *
 * Uses the www host deliberately: the apex 308-redirects to it, and a redirect
 * in an og:image chain is enough to break some crawlers.
 */
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.getrevvy.pro";

/** 800x400 on disk — the declared size must match the file or cards crop badly. */
const OG_IMAGE = {
  url: "/images/Revvylogo/logo-1-primary.png",
  width: 800,
  height: 400,
  alt: "Revvy — client approvals, without the chasing",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    // Child pages set only their own title; this frames it consistently.
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  keywords: [
    "social media approvals",
    "client approval workflow",
    "agency content calendar",
    "social media scheduling",
    "content approval software",
    "agency client portal",
  ],
  alternates: { canonical: "/" },
  // Phone-number autolinking mangles copy that merely contains digits.
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    images: [OG_IMAGE],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  icons: {
    icon: [
      { url: "/images/Revvylogo/logo-favicon.png", sizes: "64x64", type: "image/png" },
      { url: "/images/Revvylogo/logo-icon.png", sizes: "500x500", type: "image/png" },
    ],
    shortcut: "/images/Revvylogo/logo-favicon.png",
    apple: [
      { url: "/images/Revvylogo/logo-2-square.png", sizes: "800x800", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  // Matches --background in globals.css so the mobile browser chrome blends in.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

const appUrl = SITE_URL;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      allowedRedirectOrigins={[appUrl, "http://localhost:3000", "http://127.0.0.1:3000"]}
    >
      <html
        lang="en"
        suppressHydrationWarning
        className={`${nunito.variable} ${fraunces.variable} ${geist.variable} ${geistMono.variable}`}
      >
        <head>
          <link
            rel="preload"
            href="/images/fluetdashboardimg.png"
            as="image"
            fetchPriority="high"
          />
          <link
            rel="preload"
            href="/images/Revvylogo/logo-icon.png"
            as="image"
            fetchPriority="high"
          />
        </head>
        <body className={`${nunito.className} antialiased`}>
          <GlobalErrorHandler />
          <ThemeProvider>
            {children}
            <ThemeToaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
