"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, Target, UserPlus, Check, Mail } from "lucide-react";

interface StudyBuddy {
  id: number;
  name: string;
  email: string;
  subjects: string[];
  studyGoal: string;
  avatar: string;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: StudyBuddy | null;
  isConnected: boolean;
  onConnect: () => void;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  user,
  isConnected,
  onConnect,
}: UserProfileModalProps) {
  // Handle Esc key press
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-white/20 w-full max-w-2xl overflow-hidden"
            >
              {/* Header with close button */}
              <div className="relative bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-6 border-b border-white/20">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6 text-gray-300" />
                </button>
                
                <div className="flex items-center space-x-6">
                  {/* Avatar */}
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                    {user.avatar}
                  </div>

                  {/* Name and Email */}
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">{user.name}</h2>
                    <div className="flex items-center text-gray-300">
                      <Mail className="w-4 h-4 mr-2" />
                      <p>{user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Connected Badge */}
                {isConnected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 left-4 px-4 py-2 bg-green-500/30 backdrop-blur-md text-green-200 rounded-full border border-green-400/50 flex items-center space-x-2"
                  >
                    <Check className="w-4 h-4" />
                    <span className="font-semibold">Connected</span>
                  </motion.div>
                )}
              </div>

              {/* Content */}
              <div className="p-8 space-y-6">
                {/* Subjects Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center mb-4">
                    <BookOpen className="w-6 h-6 text-purple-400 mr-3" />
                    <h3 className="text-xl font-bold text-white">Study Subjects</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {user.subjects.map((subject, index) => (
                      <motion.span
                        key={subject}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
                        className="px-4 py-2 bg-purple-500/30 text-purple-200 rounded-full text-sm font-medium border border-purple-400/50"
                      >
                        {subject}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>

                {/* Study Goal Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10"
                >
                  <div className="flex items-center mb-3">
                    <Target className="w-6 h-6 text-pink-400 mr-3" />
                    <h3 className="text-xl font-bold text-white">Study Goal</h3>
                  </div>
                  <p className="text-gray-200 leading-relaxed">{user.studyGoal}</p>
                </motion.div>

                {/* Action Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {isConnected ? (
                    <div className="bg-green-500/20 backdrop-blur-md rounded-xl p-6 border border-green-400/30 text-center">
                      <div className="flex items-center justify-center space-x-2 text-green-200">
                        <Check className="w-6 h-6" />
                        <p className="text-lg font-semibold">
                          You&apos;re connected with {user.name.split(" ")[0]}!
                        </p>
                      </div>
                      <p className="text-green-300 text-sm mt-2">
                        Start collaborating on your studies together
                      </p>
                    </div>
                  ) : (
                    <motion.button
                      onClick={onConnect}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-3 cursor-pointer"
                    >
                      <UserPlus className="w-6 h-6" />
                      <span>Send Connection Request</span>
                    </motion.button>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
