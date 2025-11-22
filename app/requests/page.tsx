"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AnimatedPage from "@/components/AnimatedPage";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Check, X, BookOpen, UserCheck, Inbox } from "lucide-react";
import toast from "react-hot-toast";

interface ConnectionRequest {
  id: number;
  name: string;
  email: string;
  subjects: string[];
  studyGoal: string;
  avatar: string;
  requestedAt: string;
}

// Mock pending connection requests
const mockRequests: ConnectionRequest[] = [
  {
    id: 101,
    name: "Sarah Johnson",
    email: "sarah@example.com",
    subjects: ["Math", "Physics", "Chemistry"],
    studyGoal: "Preparing for AP exams",
    avatar: "SJ",
    requestedAt: "2 hours ago",
  },
  {
    id: 102,
    name: "Michael Chen",
    email: "michael@example.com",
    subjects: ["Computer Science", "Math"],
    studyGoal: "Learning web development",
    avatar: "MC",
    requestedAt: "5 hours ago",
  },
  {
    id: 103,
    name: "Emily Rodriguez",
    email: "emily@example.com",
    subjects: ["Biology", "Chemistry", "Psychology"],
    studyGoal: "Medical school preparation",
    avatar: "ER",
    requestedAt: "1 day ago",
  },
  {
    id: 104,
    name: "James Park",
    email: "james@example.com",
    subjects: ["Economics", "History"],
    studyGoal: "Understanding economic theories",
    avatar: "JP",
    requestedAt: "2 days ago",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
  exit: {
    opacity: 0,
    x: -100,
    transition: {
      duration: 0.3,
    },
  },
};

export default function RequestsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [requests, setRequests] = useState<ConnectionRequest[]>(mockRequests);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  const handleAccept = async (request: ConnectionRequest) => {
    if (!user) return;

    setProcessingId(request.id);

    try {
      const response = await fetch("/api/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userEmail: user.email,
          requestId: request.id,
          buddyName: request.name,
          buddyEmail: request.email,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Remove from requests list
        setRequests((prev) => prev.filter((r) => r.id !== request.id));
        
        toast.success(`Connected with ${request.name}!`, {
          icon: "🤝",
          duration: 3000,
        });
      } else {
        toast.error(data.error || "Failed to accept connection");
      }
    } catch (error) {
      console.error("Accept error:", error);
      toast.error("Failed to accept connection");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (request: ConnectionRequest) => {
    if (!user) return;

    setProcessingId(request.id);

    try {
      const response = await fetch("/api/decline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userEmail: user.email,
          requestId: request.id,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Wait for exit animation to complete
        setTimeout(() => {
          setRequests((prev) => prev.filter((r) => r.id !== request.id));
        }, 300);
        
        toast.success("Request declined", {
          icon: "👋",
          duration: 2000,
        });
      } else {
        toast.error(data.error || "Failed to decline request");
      }
    } catch (error) {
      console.error("Decline error:", error);
      toast.error("Failed to decline request");
    } finally {
      setProcessingId(null);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AnimatedPage>
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center mb-4">
              <UserCheck className="w-12 h-12 text-white mr-3" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Connection Requests
              </h1>
            </div>
            <p className="text-xl text-gray-300">
              {requests.length > 0
                ? `You have ${requests.length} pending ${requests.length === 1 ? "request" : "requests"}`
                : "No pending requests at the moment"}
            </p>
          </motion.div>

          {/* Requests List */}
          {requests.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              <AnimatePresence mode="popLayout">
                {requests.map((request) => (
                  <motion.div
                    key={request.id}
                    variants={cardVariants}
                    layout
                    exit="exit"
                    className="bg-white/5 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-6 md:p-8 hover:shadow-3xl transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      {/* User Info */}
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Avatar */}
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 flex items-center justify-center text-white text-xl md:text-2xl font-bold shadow-xl flex-shrink-0">
                          {request.avatar}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
                            {request.name}
                          </h3>
                          <p className="text-gray-400 text-sm mb-3">{request.email}</p>

                          {/* Subjects */}
                          <div className="flex items-center mb-3">
                            <BookOpen className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                            <div className="flex flex-wrap gap-2">
                              {request.subjects.map((subject) => (
                                <span
                                  key={subject}
                                  className="px-3 py-1 bg-gray-700/30 text-gray-200 rounded-full text-xs font-medium"
                                >
                                  {subject}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Study Goal */}
                          <p className="text-gray-400 text-sm line-clamp-2 mb-2">
                            {request.studyGoal}
                          </p>

                          {/* Timestamp */}
                          <p className="text-gray-500 text-xs">Requested {request.requestedAt}</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex md:flex-col gap-3 md:w-40">
                        <motion.button
                          onClick={() => handleAccept(request)}
                          disabled={processingId === request.id}
                          whileHover={{ scale: processingId === request.id ? 1 : 1.05 }}
                          whileTap={{ scale: processingId === request.id ? 1 : 0.95 }}
                          className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-green-700 to-gray-800 hover:from-green-800 hover:to-gray-900 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer"
                        >
                          <Check className="w-5 h-5" />
                          <span>Accept</span>
                        </motion.button>

                        <motion.button
                          onClick={() => handleDecline(request)}
                          disabled={processingId === request.id}
                          whileHover={{ scale: processingId === request.id ? 1 : 1.05 }}
                          whileTap={{ scale: processingId === request.id ? 1 : 0.95 }}
                          className="flex-1 md:flex-none px-6 py-3 bg-red-900/20 hover:bg-red-900/30 border-2 border-red-900/50 text-red-200 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                          <span>Decline</span>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            // Empty State
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-12 md:p-16 text-center"
            >
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Inbox className="w-24 h-24 text-white/50 mx-auto mb-6" />
              </motion.div>
              <h3 className="text-3xl font-bold text-white mb-4">No Pending Requests</h3>
              <p className="text-gray-400 text-lg max-w-md mx-auto mb-8">
                You&apos;re all caught up! When someone sends you a connection request, it will appear here.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/search")}
                className="px-8 py-4 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 hover:from-gray-800 hover:to-gray-950 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                Find Study Buddies
              </motion.button>
            </motion.div>
          )}
        </div>
      </main>
    </AnimatedPage>
  );
}
