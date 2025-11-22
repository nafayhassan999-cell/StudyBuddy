'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, Sparkles, Lock, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AnimatedPage from '@/components/AnimatedPage';
import toast from 'react-hot-toast';

const subjects = ['Math', 'Science', 'History', 'Computer Science', 'Physics', 'Chemistry', 'Biology', 'English'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export default function CreateGroupPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    privacy: 'public',
  });
  const [errors, setErrors] = useState({
    name: '',
    subject: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  // Validate form
  const validateForm = () => {
    const newErrors = {
      name: '',
      subject: '',
    };
    let isValid = true;

    if (formData.name.trim().length < 3) {
      newErrors.name = 'Group name must be at least 3 characters';
      isValid = false;
    }

    if (!formData.subject) {
      newErrors.subject = 'Please select a subject';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/groups/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          creatorEmail: user?.email,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Save to localStorage
        const existingGroups = JSON.parse(localStorage.getItem('study_groups') || '[]');
        const newGroup = {
          id: data.groupId,
          name: formData.name,
          subject: formData.subject,
          privacy: formData.privacy,
          creator: user?.email,
          members: [user?.email],
          createdAt: new Date().toISOString(),
        };
        existingGroups.push(newGroup);
        localStorage.setItem('study_groups', JSON.stringify(existingGroups));

        // Show success toast
        toast.success('Group created successfully! 🎉', {
          icon: '✨',
          duration: 3000,
        });

        // Navigate to group page
        setTimeout(() => {
          router.push(`/groups/${data.groupId}`);
        }, 500);
      } else {
        throw new Error(data.error || 'Failed to create group');
      }
    } catch (error) {
      console.error('Create group error:', error);
      toast.error('Failed to create group. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AnimatedPage>
      <main className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
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
                Create Study Group
              </h1>
            </div>
            <p className="text-white/90 text-lg">
              Start a new study group and invite your buddies
            </p>
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 md:p-10"
          >
            <form onSubmit={handleSubmit}>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                {/* Group Name */}
                <motion.div variants={fieldVariants}>
                  <label
                    htmlFor="name"
                    className="block text-white font-semibold mb-2 flex items-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    Group Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Calculus Study Squad"
                    className={`w-full px-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm border ${
                      errors.name ? 'border-red-400' : 'border-white/30'
                    } text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all`}
                    disabled={isSubmitting}
                  />
                  {errors.name && (
                    <p className="mt-2 text-red-200 text-sm flex items-center gap-1">
                      ⚠️ {errors.name}
                    </p>
                  )}
                </motion.div>

                {/* Subject */}
                <motion.div variants={fieldVariants}>
                  <label
                    htmlFor="subject"
                    className="block text-white font-semibold mb-2 flex items-center gap-2"
                  >
                    📚 Subject
                  </label>
                  <select
                    id="subject"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className={`w-full px-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm border ${
                      errors.subject ? 'border-red-400' : 'border-white/30'
                    } text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all cursor-pointer`}
                    disabled={isSubmitting}
                  >
                    <option value="" className="bg-gray-800">
                      Select a subject...
                    </option>
                    {subjects.map((subject) => (
                      <option key={subject} value={subject} className="bg-gray-800">
                        {subject}
                      </option>
                    ))}
                  </select>
                  {errors.subject && (
                    <p className="mt-2 text-red-200 text-sm flex items-center gap-1">
                      ⚠️ {errors.subject}
                    </p>
                  )}
                </motion.div>

                {/* Privacy */}
                <motion.div variants={fieldVariants}>
                  <label className="block text-white font-semibold mb-3">
                    🔒 Privacy
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="privacy"
                        value="public"
                        checked={formData.privacy === 'public'}
                        onChange={(e) =>
                          setFormData({ ...formData, privacy: e.target.value })
                        }
                        className="w-5 h-5 text-purple-600 cursor-pointer"
                        disabled={isSubmitting}
                      />
                      <div className="flex items-center gap-2 flex-1 px-4 py-3 rounded-xl bg-white/10 group-hover:bg-white/20 transition-colors">
                        <Globe className="w-5 h-5 text-white" />
                        <div>
                          <p className="text-white font-medium">Public</p>
                          <p className="text-white/70 text-sm">
                            Anyone can find and join this group
                          </p>
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="privacy"
                        value="private"
                        checked={formData.privacy === 'private'}
                        onChange={(e) =>
                          setFormData({ ...formData, privacy: e.target.value })
                        }
                        className="w-5 h-5 text-purple-600 cursor-pointer"
                        disabled={isSubmitting}
                      />
                      <div className="flex items-center gap-2 flex-1 px-4 py-3 rounded-xl bg-white/10 group-hover:bg-white/20 transition-colors">
                        <Lock className="w-5 h-5 text-white" />
                        <div>
                          <p className="text-white font-medium">Private</p>
                          <p className="text-white/70 text-sm">
                            Only invited members can join
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                </motion.div>

                {/* Submit Button */}
                <motion.div variants={fieldVariants}>
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                        Creating Group...
                      </>
                    ) : (
                      <>
                        <Users className="w-5 h-5" />
                        Create Study Group
                      </>
                    )}
                  </motion.button>
                </motion.div>

                {/* Cancel Button */}
                <motion.div variants={fieldVariants}>
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </motion.div>
              </motion.div>
            </form>
          </motion.div>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6"
          >
            <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              💡 Tips for Creating a Great Study Group
            </h3>
            <ul className="space-y-2 text-white/90 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-yellow-300">★</span>
                <span>Choose a descriptive name that reflects your study goals</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300">★</span>
                <span>Public groups help you find more study buddies</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300">★</span>
                <span>Private groups are perfect for close-knit study circles</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </main>
    </AnimatedPage>
  );
}
