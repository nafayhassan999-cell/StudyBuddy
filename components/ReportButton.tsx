"use client";

import { useState } from "react";
import { AlertTriangle, Flag, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReportModal from "./ReportModal";

interface ReportButtonProps {
  type: 'user' | 'message' | 'group';
  targetId: string;
  targetUserId?: string;
  targetUserName?: string;
  targetContent?: string;
  variant?: 'icon' | 'text' | 'menu';
  className?: string;
}

export default function ReportButton({
  type,
  targetId,
  targetUserId,
  targetUserName,
  targetContent,
  variant = 'icon',
  className = '',
}: ReportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
    setIsMenuOpen(false);
  };

  if (variant === 'menu') {
    return (
      <>
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${className}`}
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </motion.button>

          <AnimatePresence>
            {isMenuOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsMenuOpen(false)}
                />

                {/* Popover Menu */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-48 bg-gray-900 border border-white/20 rounded-xl shadow-2xl overflow-hidden z-20"
                >
                  <button
                    onClick={handleReport}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-500/20 text-left text-white transition-colors"
                  >
                    <Flag className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-medium">Report</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <ReportModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          type={type}
          targetId={targetId}
          targetUserId={targetUserId}
          targetUserName={targetUserName}
          targetContent={targetContent}
        />
      </>
    );
  }

  if (variant === 'text') {
    return (
      <>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleReport}
          className={`flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold rounded-lg transition-all duration-300 ${className}`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Report</span>
        </motion.button>

        <ReportModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          type={type}
          targetId={targetId}
          targetUserId={targetUserId}
          targetUserName={targetUserName}
          targetContent={targetContent}
        />
      </>
    );
  }

  // Default: icon variant
  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleReport}
        className={`p-2 hover:bg-red-500/20 rounded-lg transition-colors group ${className}`}
        title="Report"
      >
        <AlertTriangle className="w-4 h-4 text-gray-400 group-hover:text-red-400 transition-colors" />
      </motion.button>

      <ReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={type}
        targetId={targetId}
        targetUserId={targetUserId}
        targetUserName={targetUserName}
        targetContent={targetContent}
      />
    </>
  );
}
