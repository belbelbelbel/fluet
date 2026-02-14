import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs"
import { dark } from '@clerk/themes'
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

export const metadata: Metadata = {
  title: "Revvy — Social Media Management for Nigerian Agencies",
  description: "Manage multiple clients, generate AI content, schedule posts, and track performance. Built for Nigerian social media managers and agencies.",
  openGraph: {
    title: "Revvy — Social Media Management for Nigerian Agencies",
    description: "Manage multiple clients, generate AI content, schedule posts, and track performance. Built for Nigerian social media managers and agencies.",
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
    title: "Revvy — Social Media Management for Nigerian Agencies",
    description: "Manage multiple clients, generate AI content, schedule posts, and track performance. Built for Nigerian social media managers and agencies.",
    images: ["/images/Revvylogo/logo-1-primary.png"], // Your logo for Twitter cards
  },
  icons: {
    icon: "/images/Revvylogo/logo-icon-dark-transparent.png", // Favicon
    apple: "/images/Revvylogo/logo-2-square.png", // Apple touch icon
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark
      }}
      afterSignOutUrl="/"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <html lang="en" suppressHydrationWarning className={nunito.variable}>
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
