"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SignInButton,
  SignUpButton,
  UserButton,
  SignedOut,
  SignedIn,
  useAuth,
} from "@clerk/nextjs";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Menu, X, PenTool } from "lucide-react";

export function Navbar() {
  const { userId } = useAuth();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 10);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);
  
  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const navItems = useMemo(() => ["Pricing", "Docs"], []);

  const isActive = useCallback((path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  }, [pathname]);

  return (
    <header
      className={`fixed top-0 left-0  right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-gray-900/80 backdrop-blur-md" : "bg-transparent"
        }`}
    >
      <nav className="container mx-auto px-4 sm:px-8 py-4 sm:py-6">
        <div className="flex flex-wrap justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <PenTool className="w-8 h-8 text-blue-500" />
              <span className="text-xl sm:text-2xl font-bold text-white">
                Fluet AI
              </span>
            </Link>
          </div>
          <button
            className="sm:hidden text-white focus:outline-none"
            onClick={toggleMenu}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
          <div
            className={`w-full sm:w-auto ${isMenuOpen ? "block" : "hidden"
              } sm:block mt-4 sm:mt-0`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6">
              {/* Public Navigation */}
              {navItems.map((item) => {
                const href = `/${item.toLowerCase()}`;
                const active = isActive(href);
                return (
                  <Link
                    key={item}
                    href={href}
                    className={`${
                      active ? "text-white font-medium" : "text-gray-300"
                    } hover:text-white transition-colors py-2 sm:py-0 relative group text-sm sm:text-base`}
                  >
                    {item}
                    <span
                      className={`absolute left-0 right-0 bottom-0 h-0.5 bg-blue-500 transition-transform origin-left ${
                        active
                          ? "scale-x-100"
                          : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    ></span>
                  </Link>
                );
              })}
              
              {/* Divider for signed-in users */}
              {userId && (
                <div className="hidden sm:block w-px h-6 bg-gray-700 mx-2"></div>
              )}
              
              {/* User Navigation */}
              {userId && (
                <>
                  <Link
                    href="/generate"
                    className={`${
                      isActive("/generate") ? "text-white font-medium" : "text-gray-300"
                    } hover:text-white transition-colors py-2 sm:py-0 relative group text-sm sm:text-base`}
                  >
                    Generate
                    <span
                      className={`absolute left-0 right-0 bottom-0 h-0.5 bg-blue-500 transition-transform origin-left ${
                        isActive("/generate")
                          ? "scale-x-100"
                          : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    ></span>
                  </Link>
                  <Link
                    href="/history"
                    className={`${
                      isActive("/history") ? "text-white font-medium" : "text-gray-300"
                    } hover:text-white transition-colors py-2 sm:py-0 relative group text-sm sm:text-base`}
                  >
                    History
                    <span
                      className={`absolute left-0 right-0 bottom-0 h-0.5 bg-blue-500 transition-transform origin-left ${
                        isActive("/history")
                          ? "scale-x-100"
                          : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    ></span>
                  </Link>
                  <Link
                    href="/schedule"
                    className={`${
                      isActive("/schedule") ? "text-white font-medium" : "text-gray-300"
                    } hover:text-white transition-colors py-2 sm:py-0 relative group text-sm sm:text-base`}
                  >
                    Schedule
                    <span
                      className={`absolute left-0 right-0 bottom-0 h-0.5 bg-blue-500 transition-transform origin-left ${
                        isActive("/schedule")
                          ? "scale-x-100"
                          : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    ></span>
                  </Link>
                </>
              )}
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="text-gray-300 hover:text-white transition-colors mt-2 sm:mt-0">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition-colors mt-2 sm:mt-0">
                    Sign Up
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10",
                    },
                  }}
                />
              </SignedIn>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}