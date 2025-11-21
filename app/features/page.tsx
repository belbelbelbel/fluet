"use client";

import { Navbar } from "../components/Navbar";
import {
  TwitterIcon,
  InstagramIcon,
  LinkedinIcon,
  MusicIcon,
  BotIcon,
  ZapIcon,
  TrendingUpIcon,
  CheckCircleIcon,
  Wand2Icon,
  FileTextIcon,
  EyeIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FeaturesPage() {
  const features = [
    {
      title: "Twitter Threads",
      icon: <TwitterIcon className="w-10 h-10 mb-4 text-blue-400" />,
      description:
        "Generate compelling Twitter threads that engage your audience and boost your reach.",
    },
    {
      title: "Instagram Captions",
      icon: <InstagramIcon className="w-10 h-10 mb-4 text-pink-400" />,
      description:
        "Create catchy captions for your Instagram posts that increase engagement and followers.",
    },
    {
      title: "LinkedIn Posts",
      icon: <LinkedinIcon className="w-10 h-10 mb-4 text-blue-600" />,
      description:
        "Craft professional content for your LinkedIn network to establish thought leadership.",
    },
    {
      title: "TikTok Content",
      icon: <MusicIcon className="w-10 h-10 mb-4 text-cyan-400" />,
      description:
        "Create viral captions, hashtags, and video scripts for TikTok that drive engagement.",
    },
  ];

  const benefits = [
    "Save time and effort on content creation",
    "Consistently produce high-quality posts",
    "Increase engagement across all platforms",
    "Stay ahead of social media trends",
    "Customize content to match your brand voice",
    "Scale your social media presence effortlessly",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-gray-100">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 sm:mb-16">
            <div className="flex items-center justify-center mb-4">
              <BotIcon className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500 mr-2" />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                Features
              </h1>
            </div>
            <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto px-4">
              Everything you need to create amazing social media content
            </p>
          </div>

          {/* Platform Features */}
          <div className="mb-12 sm:mb-20">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 text-center text-white px-4">
              Supported Platforms
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="p-6 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-gray-600 transition-all"
                >
                  <div className="flex flex-col items-center text-center">
                    {feature.icon}
                    <h3 className="text-xl font-semibold mb-3 text-white">
                      {feature.title}
                    </h3>
                    <p className="text-gray-300 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Features */}
          <div className="mb-12 sm:mb-20">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 text-center text-white px-4">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <ZapIcon className="w-8 h-8 text-yellow-400 mb-4" />
                <h3 className="text-xl font-semibold mb-3 text-white">
                  AI-Powered Generation
                </h3>
                <p className="text-gray-300">
                  Advanced AI technology creates engaging, platform-optimized content
                  tailored to your needs.
                </p>
              </div>

              <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <TrendingUpIcon className="w-8 h-8 text-green-400 mb-4" />
                <h3 className="text-xl font-semibold mb-3 text-white">
                  Customization Options
                </h3>
                <p className="text-gray-300">
                  Control tone, style, and length to match your brand voice and
                  audience preferences.
                </p>
              </div>

              <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <CheckCircleIcon className="w-8 h-8 text-blue-400 mb-4" />
                <h3 className="text-xl font-semibold mb-3 text-white">
                  Content History
                </h3>
                <p className="text-gray-300">
                  Access all your generated content, copy, edit, and manage your
                  posts from one place.
                </p>
              </div>

              <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <EyeIcon className="w-8 h-8 text-purple-400 mb-4" />
                <h3 className="text-xl font-semibold mb-3 text-white">
                  Preview & Polish
                </h3>
                <p className="text-gray-300">
                  Preview how your content will look on each platform before
                  posting.
                </p>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 text-center text-white px-4">
              Why Choose Fluet AI?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <span className="text-gray-300">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12 sm:mt-16 px-4">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white">
              Ready to get started?
            </h2>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
              <Button
                asChild
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-base sm:text-lg"
              >
                <Link href="/generate">Start Creating</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full sm:w-auto border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-base sm:text-lg"
              >
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

