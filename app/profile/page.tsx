"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AnimatedPage from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import { User, BookOpen, Target, Save, Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";

interface ProfileData {
  name: string;
  email: string;
  subjects: string[];
  studyGoal: string;
}

const availableSubjects = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "English Literature",
  "History",
  "Geography",
  "Economics",
  "Psychology",
  "Art",
  "Music",
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

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    subjects: [],
    studyGoal: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ subjects?: string; studyGoal?: string }>({});

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!isAuthenticated || !user) return;

      try {
        const response = await fetch(`/api/profile?email=${user.email}`);
        
        if (response.ok) {
          const data = await response.json();
          setProfile({
            name: user.name || "",
            email: user.email || "",
            subjects: data.subjects || [],
            studyGoal: data.studyGoal || "",
          });
        } else {
          // Profile doesn't exist yet, use user data
          setProfile({
            name: user.name || "",
            email: user.email || "",
            subjects: [],
            studyGoal: "",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated, user]);

  const validateForm = (): boolean => {
    const newErrors: { subjects?: string; studyGoal?: string } = {};

    if (profile.subjects.length === 0) {
      newErrors.subjects = "Please select at least one subject";
    }

    if (profile.studyGoal.trim().length < 10) {
      newErrors.studyGoal = "Study goal must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubjectToggle = (subject: string) => {
    setProfile((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }));
    // Clear error when user makes a change
    if (errors.subjects) {
      setErrors((prev) => ({ ...prev, subjects: undefined }));
    }
  };

  const handleGoalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setProfile((prev) => ({ ...prev, studyGoal: e.target.value }));
    // Clear error when user types
    if (errors.studyGoal) {
      setErrors((prev) => ({ ...prev, studyGoal: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: profile.email,
          name: profile.name,
          subjects: profile.subjects,
          studyGoal: profile.studyGoal,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Profile updated successfully!", {
          icon: "✅",
          duration: 3000,
        });
      } else {
        toast.error(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <AnimatedPage>
        <main className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-16 h-16 text-white animate-spin" />
            <p className="text-white text-lg font-semibold">Loading profile...</p>
          </div>
        </main>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <main className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Your Profile
            </h1>
            <p className="text-xl text-white/80">
              Customize your learning experience
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 md:p-12"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* User Info Section */}
              <motion.div variants={itemVariants} className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <User className="w-8 h-8 text-blue-300" />
                  <h2 className="text-2xl font-bold text-white">Personal Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-200 mb-2 font-medium">Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      disabled
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white cursor-not-allowed opacity-70"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-200 mb-2 font-medium">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white cursor-not-allowed opacity-70"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Subjects Section */}
              <motion.div variants={itemVariants} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-8 h-8 text-purple-300" />
                    <h2 className="text-2xl font-bold text-white">Study Subjects</h2>
                  </div>
                  {profile.subjects.length > 0 && (
                    <span className="px-3 py-1 bg-purple-500/30 text-purple-200 rounded-full text-sm font-medium">
                      {profile.subjects.length} selected
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {availableSubjects.map((subject) => {
                    const isSelected = profile.subjects.includes(subject);
                    return (
                      <motion.button
                        key={subject}
                        type="button"
                        onClick={() => handleSubjectToggle(subject)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 cursor-pointer ${
                          isSelected
                            ? "bg-purple-500 text-white shadow-lg shadow-purple-500/50"
                            : "bg-white/10 text-gray-200 hover:bg-white/20 border border-white/20"
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 inline mr-1" />}
                        {subject}
                      </motion.button>
                    );
                  })}
                </div>

                {errors.subjects && (
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-red-300 text-sm flex items-center"
                  >
                    <span className="mr-2">⚠️</span>
                    {errors.subjects}
                  </motion.p>
                )}
              </motion.div>

              {/* Study Goal Section */}
              <motion.div variants={itemVariants} className="space-y-6">
                <div className="flex items-center space-x-3">
                  <Target className="w-8 h-8 text-pink-300" />
                  <h2 className="text-2xl font-bold text-white">Study Goal</h2>
                </div>

                <div>
                  <label className="block text-gray-200 mb-2 font-medium">
                    What are your learning objectives?
                  </label>
                  <textarea
                    value={profile.studyGoal}
                    onChange={handleGoalChange}
                    rows={6}
                    placeholder="Describe your study goals, targets, and what you hope to achieve..."
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-gray-300 text-sm">
                      {profile.studyGoal.length} characters
                    </p>
                    {profile.studyGoal.length >= 10 && (
                      <p className="text-green-300 text-sm flex items-center">
                        <Check className="w-4 h-4 mr-1" />
                        Looks good!
                      </p>
                    )}
                  </div>
                </div>

                {errors.studyGoal && (
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-red-300 text-sm flex items-center"
                  >
                    <span className="mr-2">⚠️</span>
                    {errors.studyGoal}
                  </motion.p>
                )}
              </motion.div>

              {/* Submit Button */}
              <motion.div variants={itemVariants}>
                <motion.button
                  type="submit"
                  disabled={isSaving}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-6 h-6" />
                      <span>Save Profile</span>
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </div>
      </main>
    </AnimatedPage>
  );
}
