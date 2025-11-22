"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AnimatedPage from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import { Trophy, Medal, TrendingUp, Flame, Award, Star, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LeaderboardPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [badges, setBadges] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    // Load user stats
    const streakData = localStorage.getItem('streak');
    const badgesData = localStorage.getItem('badges');

    if (streakData) {
      const streak = JSON.parse(streakData);
      setCurrentStreak(streak.current || 0);
    }

    if (badgesData) {
      setBadges(JSON.parse(badgesData));
    }
  }, []);

  // Mock leaderboard data
  const leaderboardData = [
    { rank: 1, name: "Alex Chen", points: 2450, streak: 45, badges: 8 },
    { rank: 2, name: "Sarah Johnson", points: 2280, streak: 38, badges: 7 },
    { rank: 3, name: "Mike Williams", points: 2150, streak: 32, badges: 7 },
    { rank: 4, name: "Emma Davis", points: 1980, streak: 28, badges: 6 },
    { rank: 5, name: "James Brown", points: 1850, streak: 25, badges: 6 },
    { rank: 6, name: "Lisa Anderson", points: 1720, streak: 22, badges: 5 },
    { rank: 7, name: "Tom Martinez", points: 1650, streak: 20, badges: 5 },
    { rank: 8, name: user?.name || "You", points: 1580, streak: currentStreak, badges: badges.filter(b => b.earned).length, isCurrentUser: true },
    { rank: 9, name: "Jessica Taylor", points: 1450, streak: 18, badges: 4 },
    { rank: 10, name: "David Wilson", points: 1380, streak: 15, badges: 4 },
  ];

  const getRankColor = (rank: number) => {
    if (rank === 1) return "from-yellow-400 to-yellow-600";
    if (rank === 2) return "from-gray-300 to-gray-400";
    if (rank === 3) return "from-amber-600 to-amber-700";
    return "from-blue-500 to-blue-600";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <Star className="w-5 h-5 text-blue-400" />;
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AnimatedPage>
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>

            <div className="text-center">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="inline-block mb-4"
              >
                <Trophy className="w-16 h-16 text-yellow-400" />
              </motion.div>
              <h1 className="text-5xl font-bold text-white mb-4">
                Global Leaderboard
              </h1>
              <p className="text-xl text-gray-300">
                Compete with students worldwide and climb the ranks!
              </p>
            </div>
          </motion.div>

          {/* Coming Soon Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8 p-6 bg-gradient-to-r from-gray-700/20 to-gray-800/20 backdrop-blur-xl rounded-2xl border border-gray-600/30 text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-2">🚀 Coming Soon!</h2>
            <p className="text-gray-300">
              Real-time leaderboard rankings, friend competitions, and weekly challenges are on the way!
            </p>
          </motion.div>

          {/* Leaderboard Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20"
          >
            <div className="space-y-3">
              {leaderboardData.map((entry, index) => (
                <motion.div
                  key={entry.rank}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    relative group
                    ${entry.isCurrentUser 
                      ? 'bg-gradient-to-r from-gray-600/30 to-gray-700/30 border-2 border-gray-500' 
                      : 'bg-white/5 border border-white/10'
                    }
                    rounded-xl p-4 hover:bg-white/10 transition-all duration-300
                  `}
                >
                  <div className="flex items-center justify-between">
                    {/* Left: Rank and Name */}
                    <div className="flex items-center gap-4 flex-1">
                      {/* Rank */}
                      <div className={`
                        flex items-center justify-center w-12 h-12 rounded-full
                        bg-gradient-to-br ${getRankColor(entry.rank)}
                        font-bold text-white shadow-lg
                      `}>
                        {entry.rank <= 3 ? getRankIcon(entry.rank) : entry.rank}
                      </div>

                      {/* Name */}
                      <div>
                        <h3 className={`
                          text-lg font-bold
                          ${entry.isCurrentUser ? 'text-blue-300' : 'text-white'}
                        `}>
                          {entry.name}
                          {entry.isCurrentUser && (
                            <span className="ml-2 text-xs bg-blue-500 px-2 py-1 rounded-full">
                              YOU
                            </span>
                          )}
                        </h3>
                      </div>
                    </div>

                    {/* Right: Stats */}
                    <div className="flex items-center gap-6">
                      {/* Points */}
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          <span className="text-xl font-bold text-white">
                            {entry.points.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">Points</p>
                      </div>

                      {/* Streak */}
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <Flame className="w-4 h-4 text-orange-400" />
                          <span className="text-lg font-bold text-white">
                            {entry.streak}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">Streak</p>
                      </div>

                      {/* Badges */}
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <Award className="w-4 h-4 text-yellow-400" />
                          <span className="text-lg font-bold text-white">
                            {entry.badges}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">Badges</p>
                      </div>
                    </div>
                  </div>

                  {/* Highlight effect */}
                  {entry.isCurrentUser && (
                    <motion.div
                      animate={{
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-gray-600/20 to-gray-700/20 rounded-xl pointer-events-none"
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Stats Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 backdrop-blur-xl rounded-2xl p-6 border border-yellow-400/30 text-center">
              <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
              <h3 className="text-3xl font-bold text-white mb-2">Top 10%</h3>
              <p className="text-gray-300">Your ranking among all students</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/30 text-center">
              <Flame className="w-12 h-12 text-orange-400 mx-auto mb-3" />
              <h3 className="text-3xl font-bold text-white mb-2">{currentStreak} Days</h3>
              <p className="text-gray-300">Current study streak</p>
            </div>

            <div className="bg-gradient-to-br from-gray-700/20 to-gray-800/20 backdrop-blur-xl rounded-2xl p-6 border border-gray-600/30 text-center">
              <Award className="w-12 h-12 text-purple-400 mx-auto mb-3" />
              <h3 className="text-3xl font-bold text-white mb-2">
                {badges.filter(b => b.earned).length}/{badges.length}
              </h3>
              <p className="text-gray-300">Badges earned</p>
            </div>
          </motion.div>
        </div>
      </main>
    </AnimatedPage>
  );
}
