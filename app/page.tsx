"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { Logo } from "@/components/Logo";
import {
  TwitterIcon,
  InstagramIcon,
  LinkedinIcon,
  MusicIcon,
  CheckCircleIcon,
  Wand2Icon,
  BotIcon,
  ArrowRightIcon,
  TrendingUpIcon,
  ClockIcon,
  ShieldCheckIcon,
  Calendar,
  BarChart3,
  Bolt,
} from "lucide-react";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { PricingSection } from "./components/PricingSection";
import { Accordion } from "@/components/ui/accordion";
import { useUser } from "@clerk/nextjs";

export default function Home() {
  const { isSignedIn } = useUser();
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  return (
    <div className={`min-h-screen overflow-hidden transition-colors duration-300 ${
      isDark 
        ? "bg-slate-900 text-white" 
        : "bg-white text-gray-900"
    }`}>
      <Navbar />

      <main className="relative">
        {/* Hero Section */}
        <Hero />

        {/* Features Section - Right After Hero */}
        <section className={`relative py-32 transition-colors duration-300 ${
          isDark ? "bg-slate-900" : "bg-white"
        }`}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            {/* Section Header */}
            <div className="text-center mb-20">
              <h2 className={`text-4xl sm:text-5xl font-bold mb-6 tracking-tight ${
                isDark ? "text-white" : "text-gray-950"
              }`}>
                <span className="bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">Everything</span> you need
              </h2>
              <p className={`text-xl max-w-2xl mx-auto ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}>
                <span className="bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent font-semibold">Powerful</span> features designed for <span className="bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent font-semibold">creators</span> who want to grow faster
              </p>
            </div>

            {/* Main Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Generate Content Card */}
              <Link href={isSignedIn ? "/dashboard/generate" : "/sign-up"} className={`group relative rounded-2xl border p-10 hover:border-gray-300 transition-all duration-200 ${
                isDark 
                  ? "bg-gray-800/50 border-gray-700 hover:border-gray-600" 
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}>
                <div className="relative">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-8 ${
                    isDark ? "bg-purple-500/20" : "bg-gray-100"
                  }`}>
                    <BotIcon className={`w-7 h-7 ${
                      isDark ? "text-purple-400" : "text-gray-950"
                    }`} />
                  </div>
                  <h3 className={`text-2xl font-semibold mb-4 ${
                    isDark ? "text-white" : "text-gray-950"
                  }`}>Generate Content</h3>
                  <p className={`text-base leading-relaxed mb-6 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}>Create posts in seconds using AI. Transform your ideas into engaging content.</p>
                  <div className={`flex items-center text-base font-medium ${
                    isDark ? "text-purple-400" : "text-gray-950"
                  }`}>
                    <span>Learn more</span>
                    <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>

              {/* Schedule Posts Card */}
              <Link href={isSignedIn ? "/dashboard/schedule" : "/sign-up"} className={`group relative rounded-2xl border p-10 hover:border-gray-300 transition-all duration-200 ${
                isDark 
                  ? "bg-gray-800/50 border-gray-700 hover:border-gray-600" 
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}>
                <div className="relative">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-8 ${
                    isDark ? "bg-purple-500/20" : "bg-gray-100"
                  }`}>
                    <Calendar className={`w-7 h-7 ${
                      isDark ? "text-purple-400" : "text-gray-950"
                    }`} />
                  </div>
                  <h3 className={`text-2xl font-semibold mb-4 ${
                    isDark ? "text-white" : "text-gray-950"
                  }`}>Schedule Posts</h3>
                  <p className={`text-base leading-relaxed mb-6 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}>Plan your week ahead effortlessly. Automate your posting schedule and never miss an opportunity.</p>
                  <div className={`flex items-center text-base font-medium ${
                    isDark ? "text-purple-400" : "text-gray-950"
                  }`}>
                    <span>Learn more</span>
                    <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>

              {/* Analytics Card */}
              <Link href={isSignedIn ? "/dashboard/analytics" : "/sign-up"} className={`group relative rounded-2xl border p-10 hover:border-gray-300 transition-all duration-200 ${
                isDark 
                  ? "bg-gray-800/50 border-gray-700 hover:border-gray-600" 
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}>
                <div className="relative">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-8 ${
                    isDark ? "bg-purple-500/20" : "bg-gray-100"
                  }`}>
                    <BarChart3 className={`w-7 h-7 ${
                      isDark ? "text-purple-400" : "text-gray-950"
                    }`} />
                  </div>
                  <h3 className={`text-2xl font-semibold mb-4 ${
                    isDark ? "text-white" : "text-gray-950"
                  }`}>Analytics</h3>
                  <p className={`text-base leading-relaxed mb-6 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}>Track engagement and growth. Get deep insights into your performance and optimize your strategy.</p>
                  <div className={`flex items-center text-base font-medium ${
                    isDark ? "text-purple-400" : "text-gray-950"
                  }`}>
                    <span>Learn more</span>
                    <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
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
                      <div className="w-6 h-6 flex items-center justify-center">
                        <img 
                          src="/images/Revvylogo/logo-icon.png" 
                          alt="Revvy Logo" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-lg font-bold text-gray-900">Revvy</span>
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
                        <Bolt className="w-5 h-5 text-gray-400" />
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
        <section className={`relative py-32 transition-colors duration-300 ${
          isDark ? "bg-gray-900" : "bg-gray-50"
        }`} id="features">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            {/* Section Header */}
            <div className="text-center mb-20">
              <h2 className={`text-4xl sm:text-5xl font-bold mb-6 tracking-tight ${
                isDark ? "text-white" : "text-gray-950"
              }`}>
                Works seamlessly across all platforms
              </h2>
              <p className={`text-xl max-w-2xl mx-auto ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}>
                One <span className="bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent font-semibold">tool</span> to rule them all. Create, schedule, and analyze content for every major social platform.
              </p>
            </div>

            {/* Platform Feature Cards - Professional Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {[
                {
                  title: "Twitter",
                  icon: TwitterIcon,
                  description: "Create engaging threads and posts that drive conversations.",
                  color: "bg-[#1DA1F2]",
                },
                {
                  title: "Instagram",
                  icon: InstagramIcon,
                  description: "Write catchy captions with perfect hashtags that increase engagement.",
                  color: "bg-gradient-to-br from-[#E4405F] to-[#C13584]",
                },
                {
                  title: "LinkedIn",
                  icon: LinkedinIcon,
                  description: "Craft professional content that establishes thought leadership.",
                  color: "bg-[#0077B5]",
                },
                {
                  title: "TikTok",
                  icon: MusicIcon,
                  description: "Generate viral scripts, captions, and hashtags that drive views.",
                  color: "bg-gray-950",
                },
              ].map((feature, index) => {
                const Icon = feature.icon;
                
                return (
                  <div
                    key={index}
                    className={`group relative rounded-2xl border p-8 transition-all duration-200 ${
                      isDark 
                        ? "bg-gray-800/50 border-gray-700 hover:border-gray-600" 
                        : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="relative">
                      {/* Icon Container */}
                      <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-6`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      
                      {/* Content */}
                      <h3 className={`text-xl font-semibold mb-3 ${
                        isDark ? "text-white" : "text-gray-950"
                      }`}>
                        {feature.title}
                      </h3>
                      <p className={`text-base leading-relaxed ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* Stats/Benefits Section */}
        <section className="relative py-40 sm:py-48 lg:py-56 bg-white transition-colors duration-300">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="text-center mb-24">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 tracking-tight text-gray-950">
                Real results from{" "}
                <span className="bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent font-bold">real creators</span>
            </h2>
              <p className="text-xl max-w-2xl mx-auto leading-relaxed text-gray-600">
                See how Revvy helps Nigerian agencies manage multiple clients and grow faster
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
                  className="group relative rounded-2xl border p-8 bg-white border-gray-200 hover:border-gray-300 transition-all duration-200"
                >
                  <div className="text-5xl font-bold mb-3 tracking-tight text-gray-950">
                    {stat.value}
                  </div>
                  <div className="text-sm font-semibold mb-4 uppercase tracking-wider text-gray-500">
                    {stat.label}
                  </div>
                  <p className="text-base leading-relaxed text-gray-600">
                    {stat.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <PricingSection />

        {/* Research & Intelligence Section */}
        <section className={`relative py-40 transition-colors duration-300 ${
          isDark 
            ? "bg-gradient-to-b from-gray-900 to-gray-950" 
            : "bg-gradient-to-b from-gray-50 to-white"
        }`}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            {/* Section Header */}
            <div className="text-center mb-24">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6 ${
                isDark 
                  ? "bg-purple-500/10 border-purple-500/20" 
                  : "bg-gray-100 border-gray-200"
              }`}>
                <span className={`text-sm font-semibold uppercase tracking-wider ${
                  isDark ? "text-purple-300" : "text-gray-700"
                }`}>Research-Driven Intelligence</span>
              </div>
              <h2 className={`text-4xl sm:text-5xl font-bold mb-6 tracking-tight ${
                isDark ? "text-white" : "text-gray-950"
              }`}>
                Built on real <span className="bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">creator</span> insights
              </h2>
              <p className={`text-xl max-w-3xl mx-auto ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}>
                We don&apos;t guess what works. We analyze millions of posts, measure engagement patterns, and deliver actionable intelligence that actually drives growth.
              </p>
            </div>

            {/* The Intelligence Engine */}
            <div className="max-w-6xl mx-auto mb-20">
              <div className="text-center hidden mb-16">
                <h3 className={`text-3xl font-semibold mb-4 ${
                  isDark ? "text-white" : "text-gray-950"
                }`}>The Intelligence Engine</h3>
                <p className={`text-lg max-w-2xl mx-auto ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}>
                  Three questions every <span className="bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent font-semibold">creator</span> asks. We answer them with data, not opinions.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Insight 1 */}
                <div className={`group relative rounded-2xl border p-8 transition-all duration-200 ${
                  isDark 
                    ? "bg-gray-800/50 border-gray-700 hover:border-gray-600" 
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
                    isDark ? "bg-purple-500/20" : "bg-gray-100"
                  }`}>
                    <TrendingUpIcon className={`w-6 h-6 ${
                      isDark ? "text-purple-400" : "text-gray-950"
                    }`} />
                  </div>
                  <div className={`text-sm font-semibold uppercase tracking-wider mb-3 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}>Insight #1</div>
                  <h4 className={`text-xl font-semibold mb-4 ${
                    isDark ? "text-white" : "text-gray-950"
                  }`}>
                    What topic is about to pop?
                  </h4>
                  <p className={`text-base leading-relaxed ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}>
                    We scan engagement velocity across platforms to identify rising topics before they peak. Get ahead of trends, not behind them.
                  </p>
                </div>

                {/* Insight 2 */}
                <div className={`group relative rounded-2xl border p-8 transition-all duration-200 ${
                  isDark 
                    ? "bg-gray-800/50 border-gray-700 hover:border-gray-600" 
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
                    isDark ? "bg-purple-500/20" : "bg-gray-100"
                  }`}>
                    <Bolt className={`w-6 h-6 ${
                      isDark ? "text-purple-400" : "text-gray-950"
                    }`} />
                  </div>
                  <div className={`text-sm font-semibold uppercase tracking-wider mb-3 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}>Insight #2</div>
                  <h4 className={`text-xl font-semibold mb-4 ${
                    isDark ? "text-white" : "text-gray-950"
                  }`}>
                    What hook style is working?
                  </h4>
                  <p className={`text-base leading-relaxed ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}>
                    We analyze top-performing posts to identify which opening styles drive engagement. Story-based? Question? Value-driven? We know what works.
                  </p>
                </div>

                {/* Insight 3 */}
                <div className={`group relative rounded-2xl border p-8 transition-all duration-200 ${
                  isDark 
                    ? "bg-gray-800/50 border-gray-700 hover:border-gray-600" 
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
                    isDark ? "bg-purple-500/20" : "bg-gray-100"
                  }`}>
                    <BarChart3 className={`w-6 h-6 ${
                      isDark ? "text-purple-400" : "text-gray-950"
                    }`} />
                  </div>
                  <div className={`text-sm font-semibold uppercase tracking-wider mb-3 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}>Insight #3</div>
                  <h4 className={`text-xl font-semibold mb-4 ${
                    isDark ? "text-white" : "text-gray-950"
                  }`}>
                    What format should I stop using?
                  </h4>
                  <p className={`text-base leading-relaxed ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}>
                    We track format performance across niches to show you what&apos;s underperforming. Stop wasting energy on formats that don&apos;t work.
                  </p>
                </div>
              </div>
            </div>

            {/* Research Methodology */}
            <div className="max-w-6xl mx-auto">
              <div className={`rounded-2xl border p-12 transition-colors duration-300 ${
                isDark 
                  ? "bg-gray-800/50 border-gray-700" 
                  : "bg-white border-gray-200"
              }`}>
                <div className="grid md:grid-cols-2 gap-12 items-start">
                  {/* Left: Methodology */}
                  <div>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border mb-4 ${
                      isDark 
                        ? "bg-purple-500/10 border-purple-500/20" 
                        : "bg-gray-100 border-gray-200"
                    }`}>
                      <span className={`text-xs font-semibold uppercase tracking-wider ${
                        isDark ? "text-purple-300" : "text-gray-700"
                      }`}>Our Methodology</span>
                    </div>
                    <h3 className={`text-2xl font-semibold mb-6 ${
                      isDark ? "text-white" : "text-gray-950"
                    }`}>
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
                          description: "We deliver &apos;Post this today&apos; recommendations, &apos;Avoid this format&apos; warnings, and &apos;Try this hook style&apos; suggestions—not charts, but actions.",
                        },
                      ].map((item, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              isDark ? "bg-purple-600" : "bg-gray-950"
                            }`}>
                              <span className="text-white font-semibold text-base">{item.step}</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className={`text-lg font-semibold mb-2 ${
                              isDark ? "text-white" : "text-gray-950"
                            }`}>{item.title}</h4>
                            <p className={`text-base leading-relaxed ${
                              isDark ? "text-gray-400" : "text-gray-600"
                            }`}>{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Key Differentiators */}
                  <div className="space-y-6">
                    <div className={`p-8 rounded-2xl border transition-colors duration-300 ${
                      isDark 
                        ? "bg-gray-800/30 border-gray-700" 
                        : "bg-gray-50 border-gray-200"
                    }`}>
                      <h4 className={`text-xl font-semibold mb-3 ${
                        isDark ? "text-white" : "text-gray-950"
                      }`}>Nigerian-First Intelligence</h4>
                      <p className={`text-base leading-relaxed ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}>
                        We don&apos;t use global data. Our insights are specifically tuned for Nigerian <span className="bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent font-semibold">creators</span>, understanding local context, language, and behavior patterns.
                      </p>
                    </div>

                    <div className={`p-8 rounded-2xl border transition-colors duration-300 ${
                      isDark 
                        ? "bg-gray-800/30 border-gray-700" 
                        : "bg-gray-50 border-gray-200"
                    }`}>
                      <h4 className={`text-xl font-semibold mb-3 ${
                        isDark ? "text-white" : "text-gray-950"
                      }`}>Creator Behavior Match</h4>
                      <p className={`text-base leading-relaxed ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}>
                        Built around how <span className="bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent font-semibold">creators</span> actually work: batch creation, post stacking, and scheduling. Not how tools think they should work.
                      </p>
                    </div>

                    <div className={`p-8 rounded-2xl border transition-colors duration-300 ${
                      isDark 
                        ? "bg-gray-800/30 border-gray-700" 
                        : "bg-gray-50 border-gray-200"
                    }`}>
                      <h4 className={`text-xl font-semibold mb-3 ${
                        isDark ? "text-white" : "text-gray-950"
                      }`}>Foresight, Not Hindsight</h4>
                      <p className={`text-base leading-relaxed ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}>
                        We identify what&apos;s about to trend, not what already trended. Get ahead of the curve with predictive insights.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="relative py-32 bg-white transition-colors duration-300" id="faq">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="text-center mb-20">
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight text-gray-950">
                Frequently asked questions
              </h2>
              <p className="text-xl text-gray-600">
                <span className="bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent font-semibold">Everything</span> you need to know about Revvy
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <Accordion
                items={[
                  {
                    question: "How do I create my first post?",
                    answer: "Sign up for an account, choose a subscription plan, then go to the Generate page. Select your platform (Twitter, Instagram, LinkedIn, TikTok, or YouTube), enter your topic or prompt, customize the tone and style if needed, then click Generate. Your content will appear in a modal where you can copy, edit, export, or schedule it."
                  },
                  {
                    question: "What platforms are supported?",
                    answer: "We support Twitter (threads), Instagram (captions), LinkedIn (posts), TikTok (captions, hashtags, video scripts), and YouTube (video generation and upload). Each platform has optimized content generation tailored to its format and audience."
                  },
                  {
                    question: "How does the AI generation work?",
                    answer: "Our AI uses multiple models including GPT-4o Mini, GPT-4, Claude 3 Haiku, Claude 3 Sonnet, and Gemini Pro. You can select your preferred model in Settings. The AI generates platform-optimized content based on your prompts, tone, style, and length preferences. Generated content does NOT include emojis unless specifically requested."
                  },
                  {
                    question: "What are the subscription plans?",
                    answer: "Starter: $9/month (100 posts/month), Professional: $29/month (500 posts/month), Enterprise: Custom pricing (unlimited posts). All plans include core features like content editing, export, scheduling, history, Content Ideas, and YouTube automation. Limits reset monthly on your billing date."
                  },
                  {
                    question: "Can I schedule content for later?",
                    answer: "Yes! After generating content, click 'Schedule' in the content modal, or go to the Schedule page. You can set a date and time for your content to be posted. The Schedule page shows all your upcoming and past scheduled posts."
                  },
                  {
                    question: "How do I change my AI model?",
                    answer: "Go to Settings → AI Models tab. Select your preferred AI model from the dropdown. Options include GPT-4o Mini (fast, low cost), GPT-4 (high quality), Claude 3 Haiku (fast), Claude 3 Sonnet (balanced), and Gemini Pro (multilingual). Your selection will be used for all future content generation."
                  },
                  {
                    question: "Is there a free trial?",
                    answer: "We offer a 7-day free trial for all plans. No credit card required to start. You can explore all features during the trial period."
                  },
                  {
                    question: "How does YouTube video generation work?",
                    answer: "YouTube automation allows you to generate videos with background music and visuals. Go to Settings to connect your YouTube account. Once connected, you can schedule YouTube posts that will automatically generate videos using AI-selected audio and video assets, then upload them to your channel at the scheduled time."
                  }
                ]}
                isDark={false}
              />
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative py-40 bg-gray-950 transition-colors duration-300">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <div className="text-center max-w-4xl mx-auto">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 text-white tracking-tight">
                Ready to amplify your social media impact?
              </h2>

              <p className="text-xl sm:text-2xl text-gray-300 mb-16 max-w-3xl mx-auto leading-relaxed">
                Our cutting-edge, all-in-one social media management platform is meticulously crafted to empower Nigerian <span className="bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent font-semibold">creators</span>.
              </p>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-20">
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto bg-white hover:bg-gray-100 text-gray-950 px-10 py-7 text-lg font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
                >
                  <Link href={isSignedIn ? "/dashboard/generate" : "/sign-up"}>
                    Get Started
                    <ArrowRightIcon className="ml-2 w-5 h-5" />
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
                  className="w-full sm:w-auto border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 px-10 py-7 text-lg font-semibold rounded-xl transition-all"
                >
                  View Pricing
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 text-base text-gray-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 flex-shrink-0">
                    <CheckCircleIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-semibold text-lg">10 Free Posts to Start</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 flex-shrink-0">
                    <ShieldCheckIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-semibold text-lg">No Credit Card Required</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 flex-shrink-0">
                    <ClockIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-semibold text-lg">Cancel Anytime</span>
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