"use client";

import { Navbar } from "../components/Navbar";
import {
  BookOpenIcon,
  SparklesIcon,
  HelpCircleIcon,
  CodeIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DocsPage() {
  const sections = [
    {
      title: "Getting Started",
      items: [
        {
          question: "How do I create my first post?",
          answer:
            "Sign up for an account, choose a subscription plan, then go to the Generate page. Select your platform, enter your topic, customize the tone and style, then click Generate.",
        },
        {
          question: "What platforms are supported?",
          answer:
            "We support Twitter (threads), Instagram (captions), LinkedIn (posts), and TikTok (captions, hashtags, video scripts).",
        },
        {
          question: "How do I customize the output?",
          answer:
            "Click 'Customize Output' on the Generate page. You can choose the tone (professional, casual, funny, inspiring, educational), style (concise, detailed, storytelling, list-based), and length (short, medium, long).",
        },
      ],
    },
    {
      title: "Subscription & Limits",
      items: [
        {
          question: "What are the subscription limits?",
          answer:
            "Basic plan: 100 posts/month, Pro plan: 500 posts/month, Enterprise: Unlimited posts. Limits reset monthly.",
        },
        {
          question: "What happens when I reach my limit?",
          answer:
            "You'll see a message indicating you've reached your limit. You can upgrade your plan or wait for the next billing cycle.",
        },
        {
          question: "Can I change my plan?",
          answer:
            "Yes, you can upgrade or downgrade your plan at any time from the Pricing page. Changes take effect immediately.",
        },
      ],
    },
    {
      title: "Content Management",
      items: [
        {
          question: "Where can I see my generated content?",
          answer:
            "All your generated content is saved in the History page. You can view, copy, or delete any past content.",
        },
        {
          question: "Can I edit generated content?",
          answer:
            "Currently, you can regenerate content with different settings. Full editing capabilities are coming soon.",
        },
        {
          question: "How do I preview my content?",
          answer:
            "After generating content, click the 'Preview' button to see how it will look on the selected platform.",
        },
      ],
    },
    {
      title: "Technical",
      items: [
        {
          question: "How does the AI generation work?",
          answer:
            "Our AI uses advanced language models trained on social media content to generate platform-optimized posts based on your prompts and customization settings.",
        },
        {
          question: "Is my data secure?",
          answer:
            "Yes, we use industry-standard encryption and security practices. Your content is stored securely and only accessible to you.",
        },
        {
          question: "Can I integrate with my social media accounts?",
          answer:
            "Direct posting and OAuth integration are coming soon. For now, you can copy and paste your generated content.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-gray-100">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 sm:mb-16">
            <div className="flex items-center justify-center mb-4">
              <BookOpenIcon className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400 mr-2" />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                Documentation
              </h1>
            </div>
            <p className="text-base sm:text-lg lg:text-xl text-gray-400 px-4">
              Everything you need to know about Fluet AI
            </p>
          </div>

          {/* Quick Start */}
          <div className="mb-12 p-6 bg-blue-600/10 border border-blue-500/50 rounded-lg">
            <div className="flex items-start space-x-3">
              <SparklesIcon className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold mb-2 text-white">
                  Quick Start
                </h2>
                <p className="text-gray-300 mb-4">
                  New to Fluet AI? Follow these simple steps:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-300">
                  <li>Sign up for an account</li>
                  <li>Choose a subscription plan</li>
                  <li>Go to the Generate page</li>
                  <li>Select your platform and enter a topic</li>
                  <li>Customize tone, style, and length</li>
                  <li>Click Generate and copy your content!</li>
                </ol>
              </div>
            </div>
          </div>

          {/* FAQ Sections */}
          <div className="space-y-12">
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
                  <CodeIcon className="w-6 h-6 mr-2 text-blue-400" />
                  {section.title}
                </h2>
                <div className="space-y-4">
                  {section.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="p-6 bg-gray-800 rounded-lg border border-gray-700"
                    >
                      <div className="flex items-start space-x-3 mb-3">
                        <HelpCircleIcon className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                        <h3 className="text-lg font-semibold text-white">
                          {item.question}
                        </h3>
                      </div>
                      <p className="text-gray-300 ml-8">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Support CTA */}
          <div className="mt-16 text-center p-8 bg-gray-800 rounded-lg border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-white">
              Still have questions?
            </h2>
            <p className="text-gray-400 mb-6">
              Can't find what you're looking for? We're here to help.
            </p>
            <div className="flex justify-center space-x-4">
              <Button
                asChild
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
              >
                <Link href="/pricing">View Pricing</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Link href="/generate">Try It Now</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

