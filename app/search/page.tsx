"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AnimatedPage from "@/components/AnimatedPage";
import UserProfileModal from "@/components/UserProfileModal";
import ReportButton from "@/components/ReportButton";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Users, BookOpen, UserPlus, Check, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

interface StudyBuddy {
  id: number;
  name: string;
  email: string;
  subjects: string[];
  studyGoal: string;
  avatar: string;
}

const availableSubjects = [
  "Math",
  "Science",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "English",
  "History",
  "Geography",
  "Economics",
  "Psychology",
  "Art",
];

// Mock user data
const mockUsers: StudyBuddy[] = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice@example.com",
    subjects: ["Math", "Physics"],
    studyGoal: "Preparing for university entrance exams",
    avatar: "AJ",
  },
  {
    id: 2,
    name: "Bob Smith",
    email: "bob@example.com",
    subjects: ["Computer Science", "Math"],
    studyGoal: "Learning algorithms and data structures",
    avatar: "BS",
  },
  {
    id: 3,
    name: "Carol Williams",
    email: "carol@example.com",
    subjects: ["Biology", "Chemistry"],
    studyGoal: "Medical school preparation",
    avatar: "CW",
  },
  {
    id: 4,
    name: "David Brown",
    email: "david@example.com",
    subjects: ["History", "English"],
    studyGoal: "Improving essay writing skills",
    avatar: "DB",
  },
  {
    id: 5,
    name: "Emma Davis",
    email: "emma@example.com",
    subjects: ["Art", "Psychology"],
    studyGoal: "Exploring creative expression and human behavior",
    avatar: "ED",
  },
  {
    id: 6,
    name: "Frank Miller",
    email: "frank@example.com",
    subjects: ["Economics", "Geography"],
    studyGoal: "Understanding global markets and trade",
    avatar: "FM",
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
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export default function SearchPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [searchSubject, setSearchSubject] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [searchResults, setSearchResults] = useState<StudyBuddy[]>([]);
  const [displayedResults, setDisplayedResults] = useState<StudyBuddy[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<Set<number>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<StudyBuddy | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const resultsPerPage = 3;

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  // Filter subjects for autocomplete
  const filteredSubjects = availableSubjects.filter((subject) =>
    subject.toLowerCase().includes(searchSubject.toLowerCase())
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchSubject.trim()) {
      toast.error("Please enter a subject to search");
      return;
    }

    // Mock search - filter users by subject
    const results = mockUsers.filter((user) =>
      user.subjects.some((subject) =>
        subject.toLowerCase().includes(searchSubject.toLowerCase())
      )
    );

    setSearchResults(results);
    setDisplayedResults(results.slice(0, resultsPerPage));
    setCurrentPage(1);
    setHasSearched(true);
    setShowAutocomplete(false);

    if (results.length === 0) {
      toast.error("No study buddies found for this subject");
    } else {
      toast.success(`Found ${results.length} study ${results.length === 1 ? "buddy" : "buddies"}!`);
    }
  };

  const handleConnect = (userId: number, userName: string) => {
    // Mock connect request
    setConnectedUsers((prev) => new Set(prev).add(userId));
    toast.success(`Connection request sent to ${userName}!`, {
      icon: "🤝",
      duration: 3000,
    });
  };

  const handleCardClick = (buddy: StudyBuddy) => {
    setSelectedUser(buddy);
    setIsModalOpen(true);
  };

  const handleModalConnect = async () => {
    if (!selectedUser || !user) return;

    try {
      const response = await fetch("/api/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userEmail: user.email,
          buddyId: selectedUser.id,
          buddyName: selectedUser.name,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setConnectedUsers((prev) => new Set(prev).add(selectedUser.id));
        toast.success(`Connection request sent to ${selectedUser.name}!`, {
          icon: "🤝",
          duration: 3000,
        });
      } else {
        toast.error(data.error || "Failed to send connection request");
      }
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Failed to send connection request");
    }
  };

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    const startIndex = currentPage * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    const newResults = searchResults.slice(startIndex, endIndex);

    setDisplayedResults((prev) => [...prev, ...newResults]);
    setCurrentPage(nextPage);
    toast.success("Loaded more results!");
  };

  const hasMoreResults = displayedResults.length < searchResults.length;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AnimatedPage>
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center mb-4">
              <Users className="w-12 h-12 text-white mr-3" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Find Study Buddies
              </h1>
            </div>
            <p className="text-xl text-gray-300">
              Connect with students who share your interests
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/5 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-6 md:p-8 mb-12"
          >
            <form onSubmit={handleSearch} className="relative">
              <div className="flex items-center space-x-3 mb-2">
                <Search className="w-6 h-6 text-gray-400" />
                <h2 className="text-2xl font-bold text-white">Search by Subject</h2>
              </div>

              <div className="relative mt-4">
                <input
                  type="text"
                  value={searchSubject}
                  onChange={(e) => {
                    setSearchSubject(e.target.value);
                    setShowAutocomplete(e.target.value.length > 0);
                  }}
                  onFocus={() => setShowAutocomplete(searchSubject.length > 0)}
                  placeholder="Type a subject (e.g., Math, Science, Physics...)"
                  className="w-full px-6 py-4 pr-32 rounded-xl bg-white/5 dark:bg-gray-900/40 border border-white/10 text-white text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all"
                />

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 hover:from-gray-800 hover:to-gray-950 text-white font-semibold rounded-lg shadow-lg transition-all cursor-pointer"
                >
                  Search
                </motion.button>

                {/* Autocomplete Dropdown */}
                <AnimatePresence>
                  {showAutocomplete && filteredSubjects.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white/10 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-white/10 shadow-xl overflow-hidden z-10"
                    >
                      {filteredSubjects.map((subject) => (
                        <button
                          key={subject}
                          type="button"
                          onClick={() => {
                            setSearchSubject(subject);
                            setShowAutocomplete(false);
                          }}
                          className="w-full px-6 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span>{subject}</span>
                          <BookOpen className="w-4 h-4 text-gray-400" />
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <p className="text-gray-400 text-sm mt-3">
                💡 Tip: Start typing to see subject suggestions
              </p>
            </form>
          </motion.div>

          {/* Search Results */}
          {hasSearched && (
            <>
              {displayedResults.length > 0 ? (
                <>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
                  >
                    {displayedResults.map((buddy) => {
                      const isConnected = connectedUsers.has(buddy.id);

                      return (
                        <motion.div
                          key={buddy.id}
                          variants={cardVariants}
                          onClick={() => handleCardClick(buddy)}
                          className="bg-white/5 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-6 hover:shadow-2xl transition-shadow cursor-pointer hover:scale-[1.02] transition-transform"
                        >
                          {/* Avatar */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                {buddy.avatar}
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-white">{buddy.name}</h3>
                                <p className="text-gray-400 text-sm">{buddy.email}</p>
                              </div>
                            </div>
                            {/* Report Button */}
                            <div onClick={(e) => e.stopPropagation()}>
                              <ReportButton
                                type="user"
                                targetId={buddy.id.toString()}
                                targetUserId={buddy.email}
                                targetUserName={buddy.name}
                                variant="menu"
                              />
                            </div>
                          </div>

                          {/* Subjects */}
                          <div className="mb-4">
                            <div className="flex items-center mb-2">
                              <BookOpen className="w-4 h-4 text-gray-400 mr-2" />
                              <p className="text-gray-300 text-sm font-medium">Subjects:</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {buddy.subjects.map((subject) => (
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
                          <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                            {buddy.studyGoal}
                          </p>

                          {/* Connect Button */}
                          <motion.button
                            onClick={() => handleConnect(buddy.id, buddy.name)}
                            disabled={isConnected}
                            whileHover={{ scale: isConnected ? 1 : 1.05 }}
                            whileTap={{ scale: isConnected ? 1 : 0.95 }}
                            className={`w-full px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                              isConnected
                                ? "bg-green-700/30 text-green-200 cursor-not-allowed"
                                : "bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 hover:from-gray-800 hover:to-gray-950 text-white shadow-lg"
                            }`}
                          >
                            {isConnected ? (
                              <>
                                <Check className="w-5 h-5" />
                                <span>Request Sent</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-5 h-5" />
                                <span>Connect</span>
                              </>
                            )}
                          </motion.button>
                        </motion.div>
                      );
                    })}
                  </motion.div>

                  {/* Load More Button */}
                  {hasMoreResults && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex justify-center"
                    >
                      <motion.button
                        onClick={handleLoadMore}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-4 bg-white/5 dark:bg-gray-900/40 backdrop-blur-xl hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
                      >
                        <ChevronDown className="w-5 h-5" />
                        <span>Load More ({searchResults.length - displayedResults.length} remaining)</span>
                      </motion.button>
                    </motion.div>
                  )}
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/5 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 p-12 text-center"
                >
                  <Users className="w-20 h-20 text-white/50 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">No Results Found</h3>
                  <p className="text-gray-400">
                    Try searching for a different subject
                  </p>
                </motion.div>
              )}
            </>
          )}

          {/* Initial State */}
          {!hasSearched && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 p-12 text-center"
            >
              <Search className="w-20 h-20 text-white/50 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Start Your Search</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                Enter a subject above to find study buddies who share your interests
              </p>
            </motion.div>
          )}
        </div>

        {/* User Profile Modal */}
        <UserProfileModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          user={selectedUser}
          isConnected={selectedUser ? connectedUsers.has(selectedUser.id) : false}
          onConnect={handleModalConnect}
        />
      </main>
    </AnimatedPage>
  );
}
