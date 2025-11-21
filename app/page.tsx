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
} from "lucide-react";
import { Navbar } from "./components/Navbar";

export default function Home() {

const userclerkid = globalThis.localStorage?.getItem('userclerkid') 
console.log("consoleId",userclerkid)

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-gray-100 overflow-hidden pt-20">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Decorative elements - hidden on mobile */}
        <div className="hidden md:block absolute top-20 left-10 animate-float">
          <BotIcon className="w-8 h-8 text-blue-400 opacity-50" />
        </div>
        <div className="hidden md:block absolute top-40 right-20 animate-float animation-delay-2000">
          <Wand2Icon className="w-10 h-10 text-purple-400 opacity-50" />
        </div>
        <div className="hidden lg:block absolute bottom-20 left-1/4 animate-float animation-delay-4000">
          <MessageSquareIcon className="w-12 h-12 text-green-400 opacity-50" />
        </div>

        {/* Hero Section */}
        <div className="text-center py-12 sm:py-20 lg:py-32 relative">
          <BotIcon className="w-12 h-12 sm:w-16 sm:h-16 text-blue-500 mx-auto mb-4 sm:mb-6 animate-pulse" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl  font-extrabold mb-4 sm:mb-6 px-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            AI-Powered Social Media Content Generator
          </h1>
          <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-10 text-gray-300 max-w-2xl mx-auto px-4">
            Create engaging content for Twitter, Instagram, LinkedIn, and TikTok with
            cutting-edge AI technology.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 px-4">
            <Button
              asChild
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-base sm:text-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
              <Link href="/generate">Start Creating</Link>
            </Button>
            <Button
              asChild
              className="w-full sm:w-auto bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-base sm:text-lg transition duration-300 ease-in-out"
            >
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-12 sm:py-20" id="features">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-16 text-center text-white px-4">
            Supercharge Your Social Media Presence
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                title: "Twitter Threads",
                icon: <TwitterIcon className="w-10 h-10 mb-4 text-blue-400" />,
                description:
                  "Generate compelling Twitter threads that engage your audience and boost your reach.",
              },
              {
                title: "Instagram Captions",
                icon: (
                  <InstagramIcon className="w-10 h-10 mb-4 text-pink-400" />
                ),
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
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg hover:shadow-xl transition duration-300 ease-in-out transform hover:-translate-y-1"
              >
                <div className="flex flex-col items-center text-center">
                  {feature.icon}
                  <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-300">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="py-12 sm:py-20 bg-gray-900 rounded-2xl sm:rounded-3xl my-12 sm:my-20 relative mx-4 sm:mx-0">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-3xl">
            <svg
              className="absolute w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path
                d="M0,0 L100,0 L100,100 L0,100 Z"
                fill="url(#grid-pattern)"
              />
            </svg>
            <defs>
              <pattern
                id="grid-pattern"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 10 0 L 0 0 0 10"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 text-center text-white px-4">
              Why Choose Our AI Content Generator?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 max-w-4xl mx-auto px-4">
              {[
                "Save time and effort on content creation",
                "Consistently produce high-quality posts",
                "Increase engagement across all platforms",
                "Stay ahead of social media trends",
                "Customize content to match your brand voice",
                "Scale your social media presence effortlessly",
              ].map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <span className="text-gray-300">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-12 sm:py-20 relative px-4">
          <div className="hidden md:block absolute top-10 right-10 animate-spin-slow">
            <svg
              className="w-20 h-20 text-blue-500 opacity-20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 6V12L16 14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 text-white">
            Ready to revolutionize your social media strategy?
          </h2>
          {/* {userId ? (
            <Button
              asChild
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-full text-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
              <Link href="/generate">
                Generate Content Now <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          ) : (
            <SignUpButton mode="modal">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-full text-lg transition duration-300 ease-in-out transform hover:scale-105">
                Get Started Free <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Button>
            </SignUpButton>
          )} */}
          <p className="mt-4 text-gray-400">No credit card required</p>
        </div>
      </main>
    </div>
  );
}