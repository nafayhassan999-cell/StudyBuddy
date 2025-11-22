"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Check } from "lucide-react";
import { useTheme, Theme } from "@/contexts/ThemeContext";

const themes = [
  {
    id: "default" as Theme,
    name: "Default",
    description: "Vibrant gradients",
    preview: "bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800",
    textColor: "text-white",
  },
  {
    id: "dark" as Theme,
    name: "Dark",
    description: "Premium black",
    preview: "bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900",
    textColor: "text-white",
  },
  {
    id: "white" as Theme,
    name: "White",
    description: "Clean minimalist",
    preview: "bg-gradient-to-r from-gray-100 via-blue-50 to-gray-100",
    textColor: "text-gray-800",
  },
  {
    id: "ocean" as Theme,
    name: "Ocean",
    description: "Calm blue waters",
    preview: "bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600",
    textColor: "text-white",
  },
  {
    id: "forest" as Theme,
    name: "Forest",
    description: "Natural focus",
    preview: "bg-gradient-to-r from-green-700 via-emerald-600 to-green-700",
    textColor: "text-white",
  },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Theme Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg hover:shadow-xl dark:from-gray-700 dark:to-gray-800 white:from-gray-500 white:to-gray-600 ocean:from-cyan-600 ocean:to-blue-600 forest:from-green-600 forest:to-emerald-600"
        title="Change theme"
      >
        <Palette className="w-5 h-5 text-white" />
      </motion.button>

      {/* Theme Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Dropdown Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute right-0 mt-2 w-72 bg-white/95 dark:bg-gray-900/95 white:bg-white/98 ocean:bg-ocean-card/95 forest:bg-forest-card/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 white:border-gray-300 ocean:border-ocean-border forest:border-forest-border p-3 z-50"
            >
              {/* Header */}
              <div className="px-3 py-2 mb-2">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 white:text-gray-800 ocean:text-cyan-100 forest:text-green-100">
                  Choose Theme
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 white:text-gray-600 ocean:text-cyan-300/80 forest:text-green-300/80">
                  Personalize your experience
                </p>
              </div>

              {/* Theme Options */}
              <div className="space-y-1">
                {themes.map((themeOption) => (
                  <motion.button
                    key={themeOption.id}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setTheme(themeOption.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                      theme === themeOption.id
                        ? "bg-gradient-to-r from-gray-600/20 to-gray-700/20 dark:from-gray-700/20 dark:to-gray-800/20 white:from-gray-500/10 white:to-gray-600/10 ocean:from-cyan-500/20 ocean:to-blue-500/20 forest:from-green-500/20 forest:to-emerald-500/20 border border-gray-500/30 dark:border-gray-600/30 white:border-gray-400/30 ocean:border-cyan-400/30 forest:border-green-400/30"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800/50 white:hover:bg-gray-50 ocean:hover:bg-ocean-bg/30 forest:hover:bg-forest-bg/30"
                    }`}
                  >
                    {/* Preview Circle */}
                    <div
                      className={`w-10 h-10 rounded-full ${themeOption.preview} shadow-lg flex items-center justify-center`}
                    >
                      {theme === themeOption.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", damping: 15 }}
                        >
                          <Check className={`w-5 h-5 ${themeOption.textColor}`} />
                        </motion.div>
                      )}
                    </div>

                    {/* Theme Info */}
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 white:text-gray-900 ocean:text-cyan-100 forest:text-green-100">
                        {themeOption.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 white:text-gray-600 ocean:text-cyan-300/70 forest:text-green-300/70">
                        {themeOption.description}
                      </p>
                    </div>

                    {/* Selected Indicator */}
                    {theme === themeOption.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 dark:from-gray-700 dark:to-gray-800 white:from-gray-600 white:to-gray-700 ocean:from-cyan-500 ocean:to-blue-500 forest:from-green-500 forest:to-emerald-500"
                      />
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 white:border-gray-300 ocean:border-ocean-border forest:border-forest-border">
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 white:text-gray-600 ocean:text-cyan-300/60 forest:text-green-300/60">
                  Theme saved automatically
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
