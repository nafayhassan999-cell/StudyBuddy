"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
  showLoader?: boolean;
}

const pageVariants = {
  initial: {
    opacity: 0,
    x: 300,
  },
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: -300,
  },
};

const pageTransition = {
  duration: 0.5,
  ease: [0.42, 0, 0.58, 1] as const, // easeInOut bezier curve
};

const LoadingSpinner = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600">
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center space-y-4"
    >
      <Loader2 className="w-16 h-16 text-white animate-spin" />
      <p className="text-white text-lg font-semibold">Loading...</p>
    </motion.div>
  </div>
);

export default function AnimatedPage({ 
  children, 
  className = "",
  showLoader = false 
}: AnimatedPageProps) {
  const [isLoading, setIsLoading] = useState(showLoader);

  useEffect(() => {
    if (showLoader) {
      // Simulate loading duration
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [showLoader]);

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <LoadingSpinner key="loader" />
      ) : (
        <motion.div
          key="page-content"
          layoutId="page-transition"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          transition={pageTransition}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
