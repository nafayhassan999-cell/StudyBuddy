"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Bot,
  Brain,
  Sparkles,
  FileText,
  BookOpen,
  Users,
  UserPlus,
  MessageSquare,
  Calendar,
  Trophy,
  BarChart3,
  Flag,
  Upload,
  Settings,
  Home,
  Search,
  Briefcase,
  Music,
  GraduationCap,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SidebarLink {
  href?: string;
  label: string;
  icon: any;
  description: string;
  hash?: string;
  action?: string;
}

const toolsLinks: SidebarLink[] = [
  { href: "/dashboard", label: "AI Tutor", icon: Bot, description: "Chat with AI assistant", hash: "#ai-tutor" },
  { href: "/dashboard", label: "Generate Flashcards", icon: Sparkles, description: "Create study cards", hash: "#flashcards" },
  { href: "/dashboard", label: "Quiz Generator", icon: Brain, description: "Test your knowledge", hash: "#flashcards" },
  { href: "/dashboard", label: "Document Summarizer", icon: FileText, description: "Summarize PDFs & docs", hash: "#summarizer" },
  { href: "/dashboard", label: "Study Plan Generator", icon: Calendar, description: "AI-powered study roadmap", hash: "#study-plan" },
  { href: "/exam", label: "AI Exam Simulator", icon: GraduationCap, description: "Take AI-generated exams" },
  { label: "Study Music", icon: Music, description: "Ambient sounds for focus", action: "toggleMusic" },
];

const featuresLinks = [
  { href: "/courses", label: "Browse Courses", icon: BookOpen, description: "Explore study materials" },
  { href: "/search", label: "Find Study Buddies", icon: Search, description: "Connect with peers" },
  { href: "/groups", label: "Study Groups", icon: Users, description: "Join or create groups" },
  { href: "/requests", label: "Friend Requests", icon: UserPlus, description: "Manage connections" },
];

const analyticsLinks = [
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy, description: "View rankings" },
  { href: "/dashboard", label: "Analytics", icon: BarChart3, description: "Track progress", hash: "#analytics" },
];

const adminLinks = [
  { href: "/admin/courses/create", label: "Create Course", icon: Upload, description: "Upload new course" },
];

const otherLinks = [
  { href: "/report", label: "Report Content", icon: Flag, description: "Report violations" },
  { href: "/profile", label: "Settings", icon: Settings, description: "Account settings" },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const handleLinkClick = (hash?: string) => {
    onClose();
    if (hash) {
      setTimeout(() => {
        const element = document.querySelector(hash);
        element?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 top-16 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-80 bg-gradient-to-b from-gray-900 via-gray-800/90 to-black/90 backdrop-blur-xl border-r border-white/20 shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gray-900/95 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl">
                  <Menu className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">StudyBuddy</h2>
                  <p className="text-xs text-gray-400">Tools & Features</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Navigation Sections */}
            <div className="p-4 space-y-6">
              {/* Quick Access */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
                  Quick Access
                </h3>
                <div className="space-y-1">
                  <Link
                    href="/dashboard"
                    onClick={() => handleLinkClick()}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                      pathname === "/dashboard"
                        ? "bg-gradient-to-r from-gray-600/20 to-gray-700/20 border border-gray-500/30"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <Home className="w-5 h-5 text-blue-400" />
                    <div className="flex-1">
                      <p className="text-white font-medium">Dashboard</p>
                      <p className="text-xs text-gray-400">Overview & stats</p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* AI Tools */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  AI Tools
                </h3>
                <div className="space-y-1">
                  {toolsLinks.map((link) => {
                    // Handle music player toggle action
                    if (link.action === "toggleMusic") {
                      return (
                        <button
                          key={link.label}
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent("toggleMusicPlayer"));
                            onClose();
                          }}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group hover:bg-white/5"
                        >
                          <link.icon className="w-5 h-5 text-purple-400" />
                          <div className="flex-1 text-left">
                            <p className="text-white font-medium text-sm">{link.label}</p>
                            <p className="text-xs text-gray-400">{link.description}</p>
                          </div>
                        </button>
                      );
                    }

                    // Regular link
                    return (
                      <Link
                        key={link.label}
                        href={link.href! + (link.hash || "")}
                        onClick={() => handleLinkClick(link.hash)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                          isActive(link.href!)
                            ? "bg-gradient-to-r from-gray-600/20 to-gray-700/20 border border-gray-500/30"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <link.icon className="w-5 h-5 text-purple-400" />
                        <div className="flex-1">
                          <p className="text-white font-medium text-sm">{link.label}</p>
                          <p className="text-xs text-gray-400">{link.description}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3 flex items-center gap-2">
                  <Users className="w-3 h-3" />
                  Features
                </h3>
                <div className="space-y-1">
                  {featuresLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => handleLinkClick()}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                        isActive(link.href)
                          ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <link.icon className="w-5 h-5 text-green-400" />
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">{link.label}</p>
                        <p className="text-xs text-gray-400">{link.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Analytics */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3 flex items-center gap-2">
                  <BarChart3 className="w-3 h-3" />
                  Progress
                </h3>
                <div className="space-y-1">
                  {analyticsLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href + (link.hash || "")}
                      onClick={() => handleLinkClick(link.hash)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                        isActive(link.href) && link.href !== "/dashboard"
                          ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-400/30"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <link.icon className="w-5 h-5 text-yellow-400" />
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">{link.label}</p>
                        <p className="text-xs text-gray-400">{link.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Admin */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3 flex items-center gap-2">
                  <Briefcase className="w-3 h-3" />
                  Admin
                </h3>
                <div className="space-y-1">
                  {adminLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => handleLinkClick()}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                        isActive(link.href)
                          ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-400/30"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <link.icon className="w-5 h-5 text-orange-400" />
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">{link.label}</p>
                        <p className="text-xs text-gray-400">{link.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Other */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
                  Other
                </h3>
                <div className="space-y-1">
                  {otherLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => handleLinkClick()}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                        isActive(link.href)
                          ? "bg-gradient-to-r from-gray-500/20 to-gray-600/20 border border-gray-400/30"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <link.icon className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">{link.label}</p>
                        <p className="text-xs text-gray-400">{link.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-xl border-t border-white/10 p-4">
              <div className="text-center">
                <p className="text-xs text-gray-500">StudyBuddy v1.0</p>
                <p className="text-xs text-gray-600">© 2025 All rights reserved</p>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
