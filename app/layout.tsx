import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs"
import { dark } from '@clerk/themes'
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemeToaster } from "@/components/ThemeToaster";
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
      afterSignOutUrl="/"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <html lang="en" suppressHydrationWarning className={nunito.variable}>
        <body className={`${nunito.className} antialiased`}>
          <ThemeProvider>
            {children}
            <ThemeToaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
