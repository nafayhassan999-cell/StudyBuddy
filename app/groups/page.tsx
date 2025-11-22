'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, Plus, Lock, Globe, Calendar, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AnimatedPage from '@/components/AnimatedPage';
import Link from 'next/link';

interface Group {
  id: string;
  name: string;
  subject: string;
  privacy: string;
  creator: string;
  members: string[];
  createdAt: string;
}

export default function GroupsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  // Load groups from localStorage
  useEffect(() => {
    if (!user?.email) return;
    
    try {
      const storedGroups = JSON.parse(localStorage.getItem('study_groups') || '[]');
      // Filter groups where user is a member
      const userGroups = storedGroups.filter((group: Group) =>
        group.members.includes(user.email)
      );
      setGroups(userGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <AnimatedPage>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-white border-t-transparent rounded-full"
          />
        </div>
      </AnimatedPage>
    );
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
                My Study Groups
              </h1>
            </div>
            <p className="text-gray-300 text-lg mb-6">
              Collaborate and learn together with your study groups
            </p>
            <Link href="/groups/create">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-white/5 dark:bg-gray-900/40 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 shadow-lg transition-all inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create New Group
              </motion.button>
            </Link>
          </motion.div>

          {/* Groups List */}
          {groups.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {groups.map((group, index) => {
                const isCreator = user?.email === group.creator;
                return (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="backdrop-blur-xl bg-white/5 dark:bg-gray-900/40 rounded-2xl shadow-2xl border border-white/10 p-6 hover:shadow-3xl transition-all cursor-pointer"
                    onClick={() => router.push(`/groups/${group.id}`)}
                  >
                    {/* Group Icon */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 rounded-xl flex items-center justify-center shadow-lg">
                        <Users className="w-7 h-7 text-white" />
                      </div>
                      {isCreator && (
                        <span className="px-2 py-1 bg-yellow-500/30 text-yellow-200 rounded-full text-xs font-medium">
                          Creator
                        </span>
                      )}
                    </div>

                    {/* Group Name */}
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">
                      {group.name}
                    </h3>

                    {/* Subject */}
                    <div className="mb-3">
                      <span className="px-3 py-1 bg-gray-700/30 text-gray-200 rounded-full text-sm font-medium">
                        {group.subject}
                      </span>
                    </div>

                    {/* Privacy & Members */}
                    <div className="flex items-center justify-between mb-3 text-gray-300 text-sm">
                      <span className="flex items-center gap-1">
                        {group.privacy === 'public' ? (
                          <>
                            <Globe className="w-4 h-4" />
                            Public
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            Private
                          </>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                      </span>
                    </div>

                    {/* Created Date */}
                    <div className="flex items-center gap-1 text-gray-500 text-xs mb-4">
                      <Calendar className="w-3 h-3" />
                      Created {formatDate(group.createdAt)}
                    </div>

                    {/* View Button */}
                    <motion.div
                      whileHover={{ x: 5 }}
                      className="flex items-center justify-between text-white font-semibold"
                    >
                      <span>View Group</span>
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            // Empty State
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="backdrop-blur-xl bg-white/5 dark:bg-gray-900/40 rounded-3xl shadow-2xl border border-white/10 p-12 text-center"
            >
              <Users className="w-20 h-20 text-white/40 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-3">
                No Study Groups Yet
              </h2>
              <p className="text-gray-300 text-lg mb-6">
                Create your first study group and start collaborating!
              </p>
              <Link href="/groups/create">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 hover:from-gray-800 hover:to-gray-950 text-white font-bold rounded-xl shadow-2xl transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-6 h-6" />
                  Create Your First Group
                </motion.button>
              </Link>
            </motion.div>
          )}

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 backdrop-blur-xl bg-white/5 dark:bg-gray-900/40 rounded-2xl border border-white/10 p-6"
          >
            <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              💡 Study Group Benefits
            </h3>
            <ul className="space-y-2 text-gray-200 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-yellow-300">★</span>
                <span>Real-time group chat for instant collaboration</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300">★</span>
                <span>Invite study buddies and grow your learning community</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300">★</span>
                <span>Share resources and notes with group members</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300">★</span>
                <span>Track progress and study together efficiently</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </main>
    </AnimatedPage>
  );
}
