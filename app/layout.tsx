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

const SITE_TITLE = "Revvy — Client approvals, without the chasing";
const SITE_DESCRIPTION =
  "Revvy gives your agency one link where clients review, approve, and schedule — so nothing goes out unapproved. Built for agencies managing 3–10 clients.";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: process.env.NEXT_PUBLIC_APP_URL || "https://revvy.vercel.app",
    siteName: "Revvy",
    images: [
      {
        url: "/images/Revvylogo/logo-1-primary.png", // Your logo for social sharing
        width: 1200,
        height: 630,
        alt: "Revvy Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/images/Revvylogo/logo-1-primary.png"], // Your logo for Twitter cards
  },
  icons: {
    icon: "/images/Revvylogo/logo-icon-dark-transparent.png", // Favicon
    apple: "/images/Revvylogo/logo-2-square.png", // Apple touch icon
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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
