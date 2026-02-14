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
import { useTheme } from "@/contexts/ThemeContext";
import { Logo } from "@/components/Logo";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const { userId } = useAuth();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const isDark = resolvedTheme === "dark";

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

  const navItems = useMemo(() => [
    { name: "Home", href: "/", isAnchor: false },
    { name: "Features", href: "#features", isAnchor: true },
    { name: "Pricing", href: "#pricing", isAnchor: true },
    { name: "FAQ", href: "#faq", isAnchor: true },
  ], []);

  const isActive = useCallback((path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  }, [pathname]);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b backdrop-blur-sm ${
          isDark
            ? isScrolled
              ? "bg-gray-950/90 border-gray-800 shadow-lg"
              : "bg-gray-950/95 border-gray-800/50"
            : isScrolled
            ? "bg-white/80 border-gray-200 shadow-sm"
            : "bg-white/95 border-gray-200/50"
        }`}
      >
        <nav className="container mx-auto px-4 sm:px-8 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            {/* Logo - Left - Matching Dashboard */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                  <Logo size="lg" variant="icon" />
                <span className={`text-lg font-bold ${
                  isDark ? "text-white" : "text-gray-950"
                }`}>
                  Revvy
                </span>
              </Link>
            </div>

            {/* Navigation Links - Center */}
            <div className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
              {navItems.map((item) => {
                const active = item.isAnchor ? false : isActive(item.href);
                const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
                  if (item.isAnchor) {
                    e.preventDefault();
                    const element = document.querySelector(item.href);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }
                };
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={handleClick}
                    className={`${
                      active 
                      ? isDark ? "text-white font-semibold" : "text-gray-900 font-semibold"
                      : isDark ? "text-gray-400" : "text-gray-600"
                    } ${
                      isDark ? "hover:text-white" : "hover:text-gray-900"
                    } transition-colors text-sm font-medium cursor-pointer`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* User Actions - Right */}
            <div className="flex items-center space-x-4">
              <button
                className={`md:hidden ${
                  isDark ? "text-white" : "text-gray-900"
                } focus:outline-none`}
                onClick={toggleMenu}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>

              <div className="hidden md:flex items-center space-x-4">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className={`${
                      isDark 
                        ? "text-gray-300 hover:text-white bg-gray-900 border-gray-800"
                        : "text-gray-700 hover:text-gray-900 bg-white border-gray-200"
                    } transition-colors text-sm font-medium px-4 py-2 rounded-lg`}>
                      Log in
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium">
                      Sign up
                    </button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <Link
                    href="/dashboard"
                    className={`${
                      isActive("/dashboard")
                        ? isDark ? "text-white font-semibold" : "text-gray-900 font-semibold"
                        : isDark ? "text-gray-400" : "text-gray-600"
                    } ${
                      isDark ? "hover:text-white" : "hover:text-gray-900"
                    } transition-colors text-sm font-medium mr-2`}
                  >
                    Dashboard
                  </Link>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10",
                        card: "bg-white shadow-lg border border-gray-200",
                        modalContent: "bg-white",
                        formButtonPrimary: "bg-gray-950 hover:bg-gray-900 text-white",
                        formButtonSecondary: "bg-white hover:bg-gray-50 text-gray-950 border border-gray-200",
                      },
                      variables: {
                        colorBackground: "#ffffff",
                        colorInputBackground: "#ffffff",
                        colorInputText: "#111827",
                        colorText: "#111827",
                        colorTextSecondary: "#6b7280",
                        colorPrimary: "#111827",
                        borderRadius: "0.5rem",
                      },
                    }}
                  />
                </SignedIn>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-40 sm:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] ${
          isDark ? "bg-gray-950 border-gray-800" : "bg-white border-gray-200"
        } border-l shadow-2xl z-50 transform transition-transform duration-300 ease-in-out sm:hidden ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Logo size="lg" variant="icon" />
              <span className={`text-lg font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}>Revvy</span>
            </div>
            <button
              onClick={() => setIsMenuOpen(false)}
              className={`${
                isDark 
                  ? "text-gray-400 hover:text-white hover:bg-gray-800"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              } transition-colors p-2 rounded-lg`}
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Menu Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Public Navigation - Mobile */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Navigation
              </p>
              {navItems.map((item) => {
                const active = item.isAnchor ? false : isActive(item.href);
                const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
                  setIsMenuOpen(false);
                  if (item.isAnchor) {
                    e.preventDefault();
                    setTimeout(() => {
                      const element = document.querySelector(item.href);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 100);
                  }
                };
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={handleClick}
                    className={`block px-4 py-3 rounded-lg transition-colors ${
                      active
                        ? "bg-blue-50 text-blue-600 border border-blue-200 font-semibold"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* User Navigation - Mobile */}
            {userId && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Account
                </p>
                <Link
                  href="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg transition-colors ${
                    isActive("/dashboard")
                      ? "bg-blue-50 text-blue-600 border border-blue-200 font-semibold"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  Dashboard
                </Link>
              </div>
            )}

            {/* Auth Buttons - Mobile */}
            <div className="pt-4 border-t border-gray-200 space-y-3">
              <SignedOut>
                <SignInButton mode="modal">
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors font-medium"
                  >
                    Log in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
                  >
                    Sign up
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <div className="px-4 py-3">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10",
                        card: "bg-white shadow-lg border border-gray-200",
                        modalContent: "bg-white",
                        formButtonPrimary: "bg-gray-950 hover:bg-gray-900 text-white",
                        formButtonSecondary: "bg-white hover:bg-gray-50 text-gray-950 border border-gray-200",
                      },
                      variables: {
                        colorBackground: "#ffffff",
                        colorInputBackground: "#ffffff",
                        colorInputText: "#111827",
                        colorText: "#111827",
                        colorTextSecondary: "#6b7280",
                        colorPrimary: "#111827",
                        borderRadius: "0.5rem",
                      },
                    }}
                  />
                </div>
              </SignedIn>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}