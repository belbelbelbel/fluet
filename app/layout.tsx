import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs"
import { dark } from '@clerk/themes'
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Flippr AI — Flip Between Platforms, Create Content Instantly",
  description: "Flip seamlessly between Twitter, Instagram, LinkedIn, and TikTok. Create engaging AI-powered content for all your social platforms in seconds.",
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
    >
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
          <Toaster 
            position="top-right"
            richColors
            closeButton
            theme="dark"
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
