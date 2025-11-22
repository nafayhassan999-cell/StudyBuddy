"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, LogOut, User, Flame, Home, BookOpen, Music } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "./Sidebar";
import ThemeSwitcher from "./ThemeSwitcher";

// Simplified navbar - most features moved to sidebar
const publicNavLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/features", label: "Features", icon: BookOpen },
];

const authenticatedNavLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
];

const authNavLinks = [
  { href: "/auth/login", label: "Login" },
  { href: "/auth/signup", label: "Signup" },
];

const mobileMenuVariants = {
  offscreen: {
    x: "100%",
  },
  onscreen: {
    x: 0,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    x: "100%",
    transition: {
      duration: 0.3,
    },
  },
};

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMusicPlayerOpen, setIsMusicPlayerOpen] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const { user, isAuthenticated, logout } = useAuth();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleMusicPlayer = () => {
    // Dispatch custom event to toggle music player
    window.dispatchEvent(new CustomEvent('toggleMusicPlayer'));
  };

  // Load streak from localStorage
  useEffect(() => {
    if (isAuthenticated) {
      const streakData = localStorage.getItem('streak');
      if (streakData) {
        const streak = JSON.parse(streakData);
        setCurrentStreak(streak.current || 0);
      }
    }
  }, [isAuthenticated]);

  // Listen for streak updates
  useEffect(() => {
    const handleStreakUpdate = () => {
      const streakData = localStorage.getItem('streak');
      if (streakData) {
        const streak = JSON.parse(streakData);
        setCurrentStreak(streak.current || 0);
      }
    };

    window.addEventListener('storage', handleStreakUpdate);
    // Also listen for custom event from dashboard
    window.addEventListener('streakUpdated', handleStreakUpdate);

    return () => {
      window.removeEventListener('storage', handleStreakUpdate);
      window.removeEventListener('streakUpdated', handleStreakUpdate);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Sidebar Component */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/30 dark:bg-dark-card/30 white:bg-white/80 ocean:bg-ocean-card/30 forest:bg-forest-card/30 shadow-lg border-b border-white/20 dark:border-dark-border/30 white:border-gray-200 ocean:border-ocean-border/30 forest:border-forest-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Sidebar Toggle + Logo */}
            <div className="flex items-center gap-4">
              {/* Sidebar Toggle - Only show when authenticated */}
              {isAuthenticated && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleSidebar}
                  className="p-2 rounded-lg bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 transition-all shadow-lg"
                  aria-label="Toggle sidebar"
                >
                  <Menu className="w-5 h-5 text-white" />
                </motion.button>
              )}

              {/* Logo */}
              <Link href="/" className="flex-shrink-0">
                <motion.h1 
                  layoutId="logo"
                  className="text-2xl font-bold gradient-text cursor-pointer"
                >
                  StudyBuddy
                </motion.h1>
              </Link>
            </div>

            {/* Desktop Navigation - Minimal */}
            <div className="hidden md:flex items-center space-x-6">
              {/* Essential nav items only */}
              {!isAuthenticated && publicNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative text-gray-700 dark:text-gray-200 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors group cursor-pointer flex items-center gap-2"
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                  <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 group-hover:w-full transition-all duration-300"></span>
                </Link>
              ))}
              
              {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {/* Streak Badge - shown if streak > 10 */}
                {currentStreak >= 10 && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className="relative"
                  >
                    <motion.div
                      animate={{
                        boxShadow: [
                          '0 0 10px rgba(251, 146, 60, 0.5)',
                          '0 0 20px rgba(251, 146, 60, 0.8)',
                          '0 0 10px rgba(251, 146, 60, 0.5)',
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full border-2 border-orange-300"
                    >
                      <motion.div
                        animate={{
                          rotate: [0, 10, -10, 0],
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          repeatDelay: 1,
                        }}
                      >
                        <Flame className="w-4 h-4 text-white" />
                      </motion.div>
                      <span className="text-sm font-bold text-white">
                        {currentStreak}
                      </span>
                    </motion.div>
                  </motion.div>
                )}

                {/* Theme Switcher */}
                <ThemeSwitcher />

                {/* Music Player Toggle */}
                <motion.button
                  onClick={toggleMusicPlayer}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 backdrop-blur-md bg-gradient-to-r from-gray-600/20 to-gray-700/20 dark:from-gray-700/20 dark:to-gray-800/20 white:from-gray-600/30 white:to-gray-700/30 ocean:from-cyan-500/20 ocean:to-blue-500/20 forest:from-green-500/20 forest:to-emerald-500/20 rounded-full border border-white/30 dark:border-gray-700/30 white:border-gray-300 ocean:border-ocean-border/30 forest:border-forest-border/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
                  title="Study Music"
                >
                  <Music className="w-5 h-5 text-purple-600 dark:text-purple-400 white:text-purple-700 ocean:text-cyan-300 forest:text-green-300" />
                </motion.button>

                <div className="flex items-center space-x-2 px-4 py-2 backdrop-blur-md bg-white/20 dark:bg-gray-800/20 white:bg-gray-100/80 ocean:bg-ocean-card/30 forest:bg-forest-card/30 rounded-full border border-white/30 dark:border-gray-700/30 white:border-gray-300 ocean:border-ocean-border/30 forest:border-forest-border/30">
                  <User className="w-4 h-4 text-gray-700 dark:text-gray-200 white:text-gray-800 ocean:text-cyan-100 forest:text-green-100" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 white:text-gray-800 ocean:text-cyan-100 forest:text-green-100">
                    {user?.name}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-full transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <>
                {authNavLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative text-gray-700 dark:text-gray-200 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors group cursor-pointer"
                  >
                    {link.label}
                    <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                ))}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-700 dark:text-gray-200" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu - Simplified */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial="offscreen"
            animate="onscreen"
            exit="exit"
            variants={mobileMenuVariants}
            className="fixed top-16 right-0 h-[calc(100vh-4rem)] w-64 backdrop-blur-md bg-white/95 dark:bg-gray-900/95 shadow-2xl md:hidden"
          >
            <div className="flex flex-col p-6 space-y-4">
              {isAuthenticated ? (
                <>
                  {/* Open Sidebar Button */}
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => {
                      setIsSidebarOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 text-lg font-medium text-white bg-gradient-to-r from-gray-600 to-gray-700 py-3 px-4 rounded-lg hover:from-gray-500 hover:to-gray-600 transition-all shadow-lg"
                  >
                    <Menu className="w-5 h-5" />
                    <span>Open Menu</span>
                  </motion.button>

                  {/* User Info */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="pt-4 border-t border-gray-300 dark:border-gray-700"
                  >
                    <div className="flex items-center space-x-2 py-2 px-4">
                      <User className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                      <span className="text-lg font-medium text-gray-700 dark:text-gray-200">
                        {user?.name}
                      </span>
                    </div>
                  </motion.div>

                  {/* Logout Button */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 text-lg font-medium text-red-600 dark:text-red-400 py-2 px-4 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Logout</span>
                    </button>
                  </motion.div>
                </>
              ) : (
                <>
                  {/* Public Navigation Links */}
                  {publicNavLinks.map((link, index) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center space-x-3 text-lg font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2 px-4 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50"
                      >
                        <link.icon className="w-5 h-5" />
                        <span>{link.label}</span>
                      </Link>
                    </motion.div>
                  ))}

                  {/* Auth Links */}
                  {authNavLinks.map((link, index) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (index + publicNavLinks.length) * 0.1 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setIsMenuOpen(false)}
                        className="block text-lg font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2 px-4 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50"
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
    </>
  );
}
