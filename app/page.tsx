"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  TwitterIcon,
  InstagramIcon,
  LinkedinIcon,
  MusicIcon,
  CheckCircleIcon,
  Wand2Icon,
  BotIcon,
  MessageSquareIcon,
  ArrowRightIcon,
  SparklesIcon,
  ZapIcon,
  TrendingUpIcon,
  ClockIcon,
  UsersIcon,
  StarIcon,
  ShieldCheckIcon,
  Calendar,
  BarChart3,
  Check,
} from "lucide-react";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { PricingSection } from "./components/PricingSection";
import { useUser } from "@clerk/nextjs";

export default function Home() {
  const { isSignedIn } = useUser();

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden">
      <Navbar />

      <main className="relative">
        {/* Hero Section */}
        <Hero />

        {/* Features Section - Right After Hero */}
        <section className="relative py-32 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            {/* Section Header */}
            <div className="text-center mb-20">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-gray-950 tracking-tight">
                Everything you need to{" "}
                <span className="text-gray-950">dominate social media</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Powerful features designed for creators who want to grow faster
              </p>
            </div>

            {/* Main Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
              {/* Generate Content Card */}
              <Link href={isSignedIn ? "/dashboard/generate" : "/sign-up"} className="group relative bg-white rounded-2xl border border-gray-200 p-10 hover:border-gray-300 transition-all duration-300 overflow-hidden block cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-950/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gray-950 flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <BotIcon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-950 mb-4 tracking-tight">Generate Content</h3>
                  <p className="text-base text-gray-600 leading-relaxed mb-6">Create posts in seconds using AI. Transform your ideas into engaging content that captions your audience.</p>
                  <div className="flex items-center text-gray-950 font-semibold text-sm">
                    <span>Learn more</span>
                    <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>

              {/* Schedule Posts Card */}
              <Link href={isSignedIn ? "/dashboard/schedule" : "/sign-up"} className="group relative bg-white rounded-2xl border border-gray-200 p-10 hover:border-gray-300 transition-all duration-300 overflow-hidden block cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-950/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gray-950 flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform duration-300 relative">
                    <Calendar className="w-10 h-10 text-white" />
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-white border-2 border-gray-950 flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5 text-gray-950" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-950 mb-4 tracking-tight">Schedule Posts</h3>
                  <p className="text-base text-gray-600 leading-relaxed mb-6">Plan your week ahead effortlessly. Automate your posting schedule and never miss an opportunity to engage.</p>
                  <div className="flex items-center text-gray-950 font-semibold text-sm">
                    <span>Learn more</span>
                    <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>

              {/* Analytics Card */}
              <Link href={isSignedIn ? "/dashboard/analytics" : "/sign-up"} className="group relative bg-white rounded-2xl border border-gray-200 p-10 hover:border-gray-300 transition-all duration-300 overflow-hidden block cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-950/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gray-950 flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-950 mb-4 tracking-tight">Analytics</h3>
                  <p className="text-base text-gray-600 leading-relaxed mb-6">Track engagement and growth. Get deep insights into your performance and optimize your strategy.</p>
                  <div className="flex items-center text-gray-950 font-semibold text-sm">
                    <span>Learn more</span>
                    <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </div>

            {/* Next Section Indicator */}
            <div className="text-center hidden mb-8">
              <p className="text-xs text-gray-400">Next - Your Dashboard</p>
              <ArrowRightIcon className="w-3 h-3 mx-auto mt-1.5 text-gray-400 rotate-90" />
            </div>

            {/* Dashboard Preview - Reference Style */}
            <div className="relative hidden mt-8">
              {/* Dashboard Preview Grid */}
              <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {/* Left - Sidebar Preview */}
                <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-xl">
                  <div className="mb-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Wand2Icon className="w-6 h-6 text-gray-900" />
                      <span className="text-lg font-bold text-gray-900">Flippr AI</span>
                    </div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Menu</div>
                    <div className="space-y-2">
                      {["Dashboard", "Generate", "Analytics", "Schedule", "History"].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <span className="text-sm text-gray-700">{item}</span>
                          <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Middle - Main Dashboard Content */}
                <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-xl">
                  <div className="mb-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search..."
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <ZapIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Upgrade Card */}
                  <div className="bg-gray-50 rounded-xl p-6 mb-6 border-2 border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Upgrade your plan</h3>
                    <p className="text-sm text-gray-600 mb-4">70% discount for 1 year of subscription</p>
                    <div className="flex gap-3">
                      <Button size="sm" className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-4">
                        Go Premium
            </Button>
                      <Button size="sm" variant="outline" className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-4">
                        Try for free
            </Button>
          </div>
        </div>

                  {/* Stats Section */}
                  <div>
                    <h4 className="text-base font-bold text-gray-900 mb-2">Content Generated</h4>
                    <p className="text-xs text-gray-600 mb-4">Today vs Yesterday</p>
                    <div className="h-24 bg-gray-100 rounded-lg mb-4 flex items-end justify-around p-2">
                      {[40, 60, 45, 70, 55, 80, 65].map((height, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-900 rounded-t w-8"
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">127</div>
                        <div className="text-xs text-gray-600">Today</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">2.1K</div>
                        <div className="text-xs text-gray-600">This Month</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right - Top Content Preview */}
                <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Content</h3>
                  <div className="space-y-4">
                    {[
                      { icon: TwitterIcon, name: "Twitter Thread", status: "Posted" },
                      { icon: InstagramIcon, name: "Instagram Post", status: "Scheduled" },
                      { icon: LinkedinIcon, name: "LinkedIn Article", status: "Draft" },
                      { icon: MusicIcon, name: "TikTok Script", status: "Posted" },
                    ].map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-gray-700" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                            <div className="text-xs text-gray-600">{item.status}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Features Section - Professional */}
        <section className="relative py-32 sm:py-40 lg:py-48 bg-gray-50" id="features">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            {/* Section Header */}
            <div className="text-center mb-20">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-gray-950 tracking-tight">
                Works seamlessly across{" "}
                <span className="text-gray-950">all platforms</span>
            </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                One tool to rule them all. Create, schedule, and analyze content for every major social platform.
              </p>
            </div>

            {/* Platform Feature Cards - Professional Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {[
                {
                  title: "Twitter",
                  icon: TwitterIcon,
                  description: "Create engaging threads and posts that drive conversations and boost your reach.",
                  color: "bg-[#1DA1F2]",
                  hoverColor: "hover:bg-[#1a8cd8]",
                },
                {
                  title: "Instagram",
                  icon: InstagramIcon,
                  description: "Write catchy captions with perfect hashtags that increase engagement and followers.",
                  color: "bg-gradient-to-br from-[#E4405F] to-[#C13584]",
                  hoverColor: "hover:from-[#d12e4d] hover:to-[#b02a72]",
                },
                {
                  title: "LinkedIn",
                  icon: LinkedinIcon,
                  description: "Craft professional content that establishes thought leadership in your industry.",
                  color: "bg-[#0077B5]",
                  hoverColor: "hover:bg-[#006399]",
                },
                {
                  title: "TikTok",
                  icon: MusicIcon,
                  description: "Generate viral scripts, captions, and hashtags that drive engagement and views.",
                  color: "bg-gray-950",
                  hoverColor: "hover:bg-gray-900",
                },
              ].map((feature, index) => {
                const Icon = feature.icon;
                // Platform URLs - update with actual post URLs
                const platformUrls: Record<string, string> = {
                  Twitter: "https://twitter.com",
                  Instagram: "https://instagram.com", // Update with actual Instagram post URL
                  LinkedIn: "https://linkedin.com",
                  TikTok: "https://tiktok.com",
                };
                
                return (
                  <Link
                key={index}
                    href={platformUrls[feature.title] || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative bg-white rounded-2xl border border-gray-200 p-8 hover:border-gray-300 transition-all duration-300 overflow-hidden block cursor-pointer"
                  >
                    {/* Hover Background Effect */}
                    <div className={`absolute inset-0 ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                    
                    <div className="relative">
                      {/* Icon Container */}
                      <div className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      
                      {/* Content */}
                      <h3 className="text-2xl font-bold mb-4 text-gray-950 tracking-tight">
                    {feature.title}
                  </h3>
                      <p className="text-base text-gray-600 leading-relaxed mb-6">
                        {feature.description}
                      </p>
                      
                      {/* Learn More Link */}
                      <div className="flex items-center text-gray-950 font-semibold text-sm">
                        <span>Explore {feature.title}</span>
                        <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
                  </Link>
                );
              })}
        </div>

          </div>
        </section>

        {/* Stats/Benefits Section */}
        <section className="relative py-32 sm:py-40 lg:py-48 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="text-center mb-20">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-gray-950 tracking-tight">
                Real results from{" "}
                <span className="text-gray-950">real creators</span>
            </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                See how Flippr AI helps businesses post consistently and grow faster
              </p>
            </div>

            {/* Stats Grid - Professional */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[
                {
                  value: "2,272",
                  label: "impressions",
                  description: "Your content made high impressions, visibility and expanding your audience.",
                },
                {
                  value: "15.75%",
                  label: "content",
                  description: "Enjoy an increase of 15.75% in content shared effortlessly across platforms.",
                },
                {
                  value: "18.25%",
                  label: "savings",
                  description: "Saved 18.25% more by opting for our yearly plan, maximizing your budget.",
                },
                {
                  value: "98%",
                  label: "new followers",
                  description: "Saw a remarkable 98% growth in page followers over the past quarter.",
                },
                {
                  value: "25+",
                  label: "clients",
                  description: "Effortlessly manage social media for over 25 clients with streamlined workflows.",
                },
                {
                  value: "200+",
                  label: "scheduled weekly",
                  description: "Over 200 posts are scheduled each week across various platforms.",
                },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="group relative bg-white rounded-2xl border border-gray-200 p-10 hover:border-gray-300 transition-all duration-300"
                >
                  <div className="text-5xl sm:text-6xl font-bold mb-4 text-gray-950 tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">
                    {stat.label}
                  </div>
                  <p className="text-base text-gray-600 leading-relaxed">
                    {stat.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <PricingSection />

        {/* Research & Intelligence Section - Award-Worthy Design */}
        <section className="relative py-32 sm:py-40 lg:py-48 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            {/* Section Header */}
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-950/5 border border-gray-200 mb-6">
                <span className="text-sm font-bold text-gray-950 uppercase tracking-wider">Research-Driven Intelligence</span>
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-gray-950 tracking-tight">
                Built on{" "}
                <span className="text-gray-950">real creator insights</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                We don't guess what works. We analyze millions of posts, measure engagement patterns, and deliver actionable intelligence that actually drives growth.
              </p>
            </div>

            {/* The Golden Trio - Main Feature */}
            <div className="max-w-6xl mx-auto mb-24">
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold text-gray-950 mb-4">The Intelligence Engine</h3>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Three questions every creator asks. We answer them with data, not opinions.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Insight 1 */}
                <div className="group relative bg-white rounded-2xl border-2 border-gray-200 p-10 hover:border-gray-950 transition-all duration-300">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-950 via-gray-800 to-gray-950 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-16 h-16 rounded-2xl bg-gray-950 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                    <TrendingUpIcon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Insight #1</div>
                  <h4 className="text-2xl font-bold text-gray-950 mb-4 tracking-tight">
                    What topic is about to pop?
                  </h4>
                  <p className="text-base text-gray-600 leading-relaxed mb-6">
                    We scan engagement velocity across platforms to identify rising topics before they peak. Get ahead of trends, not behind them.
                  </p>
                  <div className="flex items-center text-gray-950 font-semibold text-sm">
                    <span>See how it works</span>
                    <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Insight 2 */}
                <div className="group relative bg-white rounded-2xl border-2 border-gray-200 p-10 hover:border-gray-950 transition-all duration-300">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-950 via-gray-800 to-gray-950 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-16 h-16 rounded-2xl bg-gray-950 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                    <ZapIcon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Insight #2</div>
                  <h4 className="text-2xl font-bold text-gray-950 mb-4 tracking-tight">
                    What hook style is working?
                  </h4>
                  <p className="text-base text-gray-600 leading-relaxed mb-6">
                    We analyze top-performing posts to identify which opening styles drive engagement. Story-based? Question? Value-driven? We know what works.
                  </p>
                  <div className="flex items-center text-gray-950 font-semibold text-sm">
                    <span>See how it works</span>
                    <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Insight 3 */}
                <div className="group relative bg-white rounded-2xl border-2 border-gray-200 p-10 hover:border-gray-950 transition-all duration-300">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-950 via-gray-800 to-gray-950 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-16 h-16 rounded-2xl bg-gray-950 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Insight #3</div>
                  <h4 className="text-2xl font-bold text-gray-950 mb-4 tracking-tight">
                    What format should I stop using?
                  </h4>
                  <p className="text-base text-gray-600 leading-relaxed mb-6">
                    We track format performance across niches to show you what's underperforming. Stop wasting energy on formats that don't work.
                  </p>
                  <div className="flex items-center text-gray-950 font-semibold text-sm">
                    <span>See how it works</span>
                    <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>

            {/* Research Methodology */}
            <div className="max-w-6xl mx-auto">
              <div className="bg-white rounded-3xl border-2 border-gray-200 p-12 shadow-xl">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  {/* Left: Methodology */}
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-950/5 border border-gray-200 mb-6">
                      <span className="text-xs font-bold text-gray-950 uppercase tracking-wider">Our Methodology</span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-950 mb-6 tracking-tight">
                      How we turn data into intelligence
                    </h3>
                    <div className="space-y-6">
                      {[
                        {
                          step: "01",
                          title: "Data Collection",
                          description: "We scan Twitter/X, Instagram, and TikTok to extract posts, engagement metrics, and timestamps—filtered by Nigeria region and creator niche.",
                        },
                        {
                          step: "02",
                          title: "Pattern Recognition",
                          description: "We group by topic (not keywords), measure engagement velocity, identify format performance, and analyze hook effectiveness.",
                        },
                        {
                          step: "03",
                          title: "Actionable Output",
                          description: "We deliver 'Post this today' recommendations, 'Avoid this format' warnings, and 'Try this hook style' suggestions—not charts, but actions.",
                        },
                      ].map((item, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-xl bg-gray-950 flex items-center justify-center">
                              <span className="text-white font-bold text-lg">{item.step}</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-gray-950 mb-2">{item.title}</h4>
                            <p className="text-base text-gray-600 leading-relaxed">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Key Differentiators */}
                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-gray-950/5 border border-gray-200">
                      <h4 className="text-xl font-bold text-gray-950 mb-4">Nigerian-First Intelligence</h4>
                      <p className="text-base text-gray-600 leading-relaxed">
                        We don't use global data. Our insights are specifically tuned for Nigerian creators, understanding local context, language, and behavior patterns.
                      </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-gray-950/5 border border-gray-200">
                      <h4 className="text-xl font-bold text-gray-950 mb-4">Creator Behavior Match</h4>
                      <p className="text-base text-gray-600 leading-relaxed">
                        Built around how creators actually work: batch creation, post stacking, and scheduling. Not how tools think they should work.
                      </p>
        </div>

                    <div className="p-6 rounded-2xl bg-gray-950/5 border border-gray-200">
                      <h4 className="text-xl font-bold text-gray-950 mb-4">Foresight, Not Hindsight</h4>
                      <p className="text-base text-gray-600 leading-relaxed">
                        We identify what's about to trend, not what already trended. Get ahead of the curve with predictive insights.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative py-32 sm:py-40 lg:py-48 bg-gray-950">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="text-center">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white tracking-tight">
                Ready to Amplify Your{" "}
                <span className="text-white">
                  Social Media Impact?
                </span>
          </h2>

              <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
                Our cutting-edge, all-in-one social media management platform is meticulously crafted to empower Nigerian creators.
          </p>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
            <Button
              asChild
                  size="lg"
                  className="w-full sm:w-auto bg-white hover:bg-gray-100 text-gray-950 px-12 py-7 text-lg font-bold rounded-xl transition-all shadow-xl"
            >
                  <Link href={isSignedIn ? "/dashboard/generate" : "/sign-up"}>
                    Get Started
                    <ArrowRightIcon className="ml-2 w-6 h-6" />
              </Link>
            </Button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.querySelector('#pricing');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="w-full sm:w-auto border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/30 px-12 py-7 text-lg font-bold rounded-xl transition-all"
                >
                  View Pricing
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-8 text-base text-gray-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                    <CheckCircleIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold">10 Free Posts to Start</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                    <ShieldCheckIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold">No Credit Card Required</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                    <ClockIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold">Cancel Anytime</span>
                </div>
              </div>
            </div>
        </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}