"use client";

import { Navbar } from "../components/Navbar";
import {
  BookOpenIcon,
  RocketIcon,
  HelpCircleIcon,
  CodeIcon,
  Wand2Icon,
  FileTextIcon,
  CalendarIcon,
  DownloadIcon,
  KeyboardIcon,
  SparklesIcon,
  CopyIcon,
  EditIcon,
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
            "Sign up for an account, choose a subscription plan, then go to the Generate page. Select your platform (Twitter, Instagram, LinkedIn, or TikTok), enter your topic or prompt, customize the tone and style if needed, then click Generate. Your content will appear in a modal where you can copy, edit, export, or schedule it.",
        },
        {
          question: "What platforms are supported?",
          answer:
            "We support Twitter (threads), Instagram (captions), LinkedIn (posts), and TikTok (captions, hashtags, video scripts). Each platform has optimized content generation tailored to its format and audience.",
        },
        {
          question: "Do I need to sign in?",
          answer:
            "Yes, you need to sign in to generate content. This ensures your content is saved to your history and allows us to track your usage according to your subscription plan.",
        },
      ],
    },
    {
      title: "Content Generation",
      items: [
        {
          question: "How do I customize the output?",
          answer:
            "Click 'Show options' on the Generate page to reveal customization settings. You can choose the tone (professional, casual, funny, inspiring, educational), style (concise, detailed, storytelling, list-based), and length (short, medium, long). These settings help tailor the content to your brand voice and audience.",
        },
        {
          question: "What are content templates?",
          answer:
            "Content templates are pre-built prompts designed for specific use cases. Click 'Templates' on the Generate page to see templates for your selected platform. Templates help you get started quickly with proven content formats.",
        },
        {
          question: "Can I edit generated content?",
          answer:
            "Yes! After generating content, click the 'Edit' button in the content modal. You can make changes directly in the editor. Press Ctrl/Cmd + S to save your changes, or Esc to cancel. Your edited content will be saved to your history.",
        },
        {
          question: "How do I preview my content?",
          answer:
            "After generating content, you can preview it in the modal or on the main page. The preview shows how your content will appear on the selected platform, helping you visualize the final result before posting.",
        },
        {
          question: "Can I regenerate content?",
          answer:
            "Yes! Click the 'Regenerate' button to create new content with the same settings. This is useful if you want to try different variations of your content.",
        },
      ],
    },
    {
      title: "Content Management",
      items: [
        {
          question: "Where can I see my generated content?",
          answer:
            "All your generated content is saved in the History page. You can view all your past content, filter by platform, copy content, schedule posts, or delete old content. Each item shows the original prompt, tone, style, and generation date.",
        },
        {
          question: "How do I export my content?",
          answer:
            "In the content modal or history page, use the dropdown menu (three dots icon) to access export options. You can export as a text file (.txt) or PDF. The PDF option opens your browser's print dialog where you can save as PDF.",
        },
        {
          question: "Can I schedule content for later?",
          answer:
            "Yes! After generating content, click 'Schedule' in the content modal, or go to the Schedule page. You can set a date and time for your content to be posted. The Schedule page shows all your upcoming and past scheduled posts.",
        },
        {
          question: "How do I copy content?",
          answer:
            "Click the copy icon (or 'Copy' button) in the content modal or history page. The content will be copied to your clipboard, and you'll see a confirmation. You can then paste it directly into your social media platform.",
        },
        {
          question: "Can I delete old content?",
          answer:
            "Yes, you can delete content from the History page. Click the delete icon (trash) on any content item to remove it permanently.",
        },
      ],
    },
    {
      title: "Scheduling & Automation",
      items: [
        {
          question: "How does content scheduling work?",
          answer:
            "Go to the Schedule page and click 'New' to create a scheduled post. Select your platform, paste or type your content, then choose a date and time. Your scheduled posts will appear in the 'Upcoming' section. Posts are automatically marked as 'Posted' after their scheduled time.",
        },
        {
          question: "Can I edit scheduled posts?",
          answer:
            "Yes! Click the edit icon on any scheduled post to modify the content, platform, or scheduled time. Changes are saved immediately.",
        },
        {
          question: "What happens to scheduled posts?",
          answer:
            "Scheduled posts are stored in your account and marked as 'Posted' after their scheduled time. You can view all past posts in the 'Past' section of the Schedule page. Note: Direct posting to social media platforms is coming soon - for now, you'll need to manually post at the scheduled time.",
        },
      ],
    },
    {
      title: "Subscription & Limits",
      items: [
        {
          question: "What are the subscription plans?",
          answer:
            "Starter: $9/month (100 posts/month), Professional: $29/month (500 posts/month), Enterprise: Custom pricing (unlimited posts). All plans include core features like content editing, export, scheduling, and history. Limits reset monthly on your billing date.",
        },
        {
          question: "What happens when I reach my limit?",
          answer:
            "You'll see a message indicating you've reached your monthly limit. You can upgrade your plan from the Pricing page, or wait for the next billing cycle when your limit resets.",
        },
        {
          question: "Can I change my plan?",
          answer:
            "Yes, you can upgrade or downgrade your plan at any time from the Pricing page. Upgrades take effect immediately, while downgrades take effect at the end of your current billing period.",
        },
        {
          question: "What payment methods do you accept?",
          answer:
            "We accept all major credit cards via Stripe (international) and local payment methods via Kora (for supported regions). Both payment methods are secure and encrypted.",
        },
        {
          question: "Is there a free trial?",
          answer:
            "We offer a 7-day free trial for all plans. No credit card required to start. You can explore all features during the trial period.",
        },
      ],
    },
    {
      title: "Keyboard Shortcuts",
      items: [
        {
          question: "What keyboard shortcuts are available?",
          answer:
            "Ctrl/Cmd + Enter: Generate content, Ctrl/Cmd + E: Edit content (in modal), Ctrl/Cmd + S: Save edited content, Esc: Close modals or cancel edit, Ctrl/Cmd + /: Show/hide keyboard shortcuts. You can see all shortcuts by clicking the keyboard icon in the bottom-right corner.",
        },
        {
          question: "Do shortcuts work on mobile?",
          answer:
            "Keyboard shortcuts are primarily designed for desktop use. On mobile devices, you can use the on-screen buttons for all actions.",
        },
      ],
    },
    {
      title: "Technical",
      items: [
        {
          question: "How does the AI generation work?",
          answer:
            "Our AI uses OpenAI's GPT-4o-mini model, trained on social media content patterns. It generates platform-optimized content based on your prompts, tone, style, and length preferences. The AI understands each platform's unique format and audience expectations.",
        },
        {
          question: "Is my data secure?",
          answer:
            "Yes, we use industry-standard encryption (256-bit SSL) for all data transmission. Your content is stored securely in our database and is only accessible to you. We never share your content with third parties.",
        },
        {
          question: "Can I integrate with my social media accounts?",
          answer:
            "Direct posting and OAuth integration are coming soon. For now, you can copy your generated content and paste it directly into your social media platforms. This gives you full control to review and edit before posting.",
        },
        {
          question: "What happens if generation fails?",
          answer:
            "If generation fails, you'll see a detailed error message. Common issues include network problems, API rate limits, or invalid prompts. Try again, or contact support if the problem persists. All errors are logged for our team to investigate.",
        },
        {
          question: "How fast is content generation?",
          answer:
            "Content generation typically takes 5-15 seconds depending on content length and complexity. You'll see a loading animation with rotating messages to keep you engaged during generation.",
        },
      ],
    },
    {
      title: "Tips & Best Practices",
      items: [
        {
          question: "How do I get the best results?",
          answer:
            "Be specific in your prompts - include key points, target audience, and desired outcome. Use templates as starting points. Experiment with different tones and styles. Review and edit generated content to match your brand voice. Use the preview feature to see how content will look before posting.",
        },
        {
          question: "What makes a good prompt?",
          answer:
            "Good prompts are specific and detailed. Instead of 'post about AI', try 'Write a Twitter thread about AI's impact on healthcare, targeting healthcare professionals, highlighting 3 key benefits'. Include context, audience, and key points you want covered.",
        },
        {
          question: "How often should I generate content?",
          answer:
            "Consistency is key for social media. We recommend generating content in batches and scheduling them throughout the week. Use the Schedule page to plan your content calendar and maintain a regular posting schedule.",
        },
        {
          question: "Can I reuse content?",
          answer:
            "Yes! All your generated content is saved in History. You can copy, edit, and reuse content for different platforms or repurpose it with modifications. This helps you maintain consistency while adapting to different platforms.",
        },
      ],
    },
  ];

  const quickLinks = [
    { title: "Generate Content", href: "/generate", icon: Wand2Icon },
    { title: "View History", href: "/history", icon: FileTextIcon },
    { title: "Schedule Posts", href: "/schedule", icon: CalendarIcon },
    { title: "View Pricing", href: "/pricing", icon: SparklesIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-gray-100">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="max-w-3xl mx-auto">
          {/* Header - Consistent */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
              <BookOpenIcon className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400 font-medium">Complete Guide</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Documentation
            </h1>
            <p className="text-base text-gray-400 max-w-2xl mx-auto">
              Everything you need to know about using Flippr AI to create amazing social media content
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.title}
                  href={link.href}
                  className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors text-center"
                >
                  <Icon className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                  <div className="text-xs text-gray-300">{link.title}</div>
                </Link>
              );
            })}
          </div>

          {/* Quick Start */}
          <div className="mb-16 p-8 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-start gap-4">
              <RocketIcon className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold mb-3 text-white">
                  Quick Start Guide
                </h2>
                <p className="text-gray-300 mb-4">
                  New to Flippr AI? Follow these steps to create your first post:
                </p>
                <ol className="space-y-3 text-gray-300">
                  <li className="flex gap-3">
                    <span className="font-semibold text-blue-400">1.</span>
                    <span>Sign up for an account and choose a subscription plan</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-blue-400">2.</span>
                    <span>Go to the Generate page and select your platform</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-blue-400">3.</span>
                    <span>Enter your topic or use a template to get started</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-blue-400">4.</span>
                    <span>Customize tone, style, and length (optional)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-blue-400">5.</span>
                    <span>Click Generate and review your content</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-blue-400">6.</span>
                    <span>Edit if needed, then copy, export, or schedule your post</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* FAQ Sections */}
          <div className="space-y-16">
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <h2 className="text-2xl font-bold mb-8 text-white flex items-center gap-3">
                  <CodeIcon className="w-6 h-6 text-blue-400" />
                  {section.title}
                </h2>
                <div className="space-y-5">
                  {section.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="p-5 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <HelpCircleIcon className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <h3 className="text-lg font-semibold text-white">
                          {item.question}
                        </h3>
                      </div>
                      <p className="text-gray-300 ml-8 leading-relaxed">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Feature Highlights */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="p-5 bg-gray-900/30 rounded-lg border border-gray-800">
              <EditIcon className="w-6 h-6 text-green-400 mb-3" />
              <h3 className="font-semibold text-white mb-2">Edit & Refine</h3>
              <p className="text-sm text-gray-400">
                Edit any generated content to match your exact needs
              </p>
            </div>
            <div className="p-5 bg-gray-900/30 rounded-lg border border-gray-800">
              <DownloadIcon className="w-6 h-6 text-blue-400 mb-3" />
              <h3 className="font-semibold text-white mb-2">Export Options</h3>
              <p className="text-sm text-gray-400">
                Export content as text files or PDFs for easy sharing
              </p>
            </div>
            <div className="p-5 bg-gray-900/30 rounded-lg border border-gray-800">
              <KeyboardIcon className="w-6 h-6 text-purple-400 mb-3" />
              <h3 className="font-semibold text-white mb-2">Keyboard Shortcuts</h3>
              <p className="text-sm text-gray-400">
                Work faster with keyboard shortcuts (Ctrl/Cmd + /)
              </p>
            </div>
          </div>

          {/* Support CTA */}
          <div className="mt-20 text-center p-10 bg-gray-900/50 rounded-xl border border-gray-800">
            <h2 className="text-2xl font-bold mb-4 text-white">
              Still have questions?
            </h2>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              Can't find what you're looking for? Check out our pricing plans or try generating your first post.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                asChild
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Link href="/pricing">View Pricing</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
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
