import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs"
import { dark } from '@clerk/themes'
import { Toaster } from "sonner";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: "variable",
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
      <html lang="en">
        <body
          className={`${nunito.variable} font-sans antialiased`}
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
