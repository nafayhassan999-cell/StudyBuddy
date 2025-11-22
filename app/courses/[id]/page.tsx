"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import {
  BookOpen,
  ArrowLeft,
  Loader2,
  Users,
  Star,
  Clock,
  Calendar,
  ExternalLink,
  Download,
  Play,
  FileText,
  Link as LinkIcon,
  Award,
  TrendingUp,
  Eye,
  CheckCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

interface Material {
  type: string;
  name: string;
  url: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  link: string;
  uploadType: string;
  category: string;
  level: string;
  duration: string;
  enrollmentCount: number;
  rating: number;
  views: number;
  createdAt: string;
  thumbnail?: string;
  instructor: string;
  materials: Material[];
}

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedDate, setCompletedDate] = useState<string | null>(null);
  const [isCompletingCourse, setIsCompletingCourse] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPremium, setIsPremium] = useState(true); // Mock premium status

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setIsLoading(true);

        // Fetch all courses and find the specific one
        const response = await fetch("/api/courses");
        const data = await response.json();

        if (data.success) {
          const foundCourse = data.courses.find((c: Course) => c.id === courseId);
          
          if (foundCourse) {
            setCourse(foundCourse);
            
            // Check if already enrolled
            const enrolled = localStorage.getItem(`enrolled_${courseId}`);
            setIsEnrolled(!!enrolled);

            // Check if already completed
            const completedCourses = JSON.parse(
              localStorage.getItem("completedCourses") || "[]"
            );
            const completedCourse = completedCourses.find(
              (c: any) => c.id === courseId
            );
            if (completedCourse) {
              setIsCompleted(true);
              setCompletedDate(completedCourse.completedAt);
            }
          } else {
            toast.error("Course not found");
            router.push("/courses");
          }
        }
      } catch (error) {
        console.error("Error fetching course:", error);
        toast.error("Failed to load course details");
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId, router]);

  const handleEnroll = () => {
    if (!course) return;

    // Save enrollment to localStorage
    localStorage.setItem(`enrolled_${courseId}`, "true");
    
    // Update enrollment count (mock)
    const updatedCourse = { ...course, enrollmentCount: course.enrollmentCount + 1 };
    setCourse(updatedCourse);
    setIsEnrolled(true);

    toast.success("🎉 Successfully enrolled in course!", {
      duration: 4000,
      icon: "📚",
    });
  };

  const handleMarkComplete = async () => {
    if (!course || isCompleted) return;

    setIsCompletingCourse(true);

    try {
      // Call API to mark as complete
      const response = await fetch("/api/courses/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: courseId,
          courseTitle: course.title,
          category: course.category,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const completedAt = data.completedAt;
        
        // Save to localStorage
        const completedCourses = JSON.parse(
          localStorage.getItem("completedCourses") || "[]"
        );
        
        // Check if already completed (prevent duplicates)
        const alreadyCompleted = completedCourses.some(
          (c: any) => c.id === courseId
        );
        
        if (!alreadyCompleted) {
          completedCourses.push({
            id: courseId,
            courseTitle: course.title,
            category: course.category,
            completedAt,
            hoursEarned: data.hoursEarned || 0,
          });
          localStorage.setItem("completedCourses", JSON.stringify(completedCourses));

          // Update dashboard stats (mock)
          const currentStats = JSON.parse(localStorage.getItem("dashboardStats") || "{}");
          const updatedStats = {
            ...currentStats,
            coursesCompleted: (currentStats.coursesCompleted || 0) + 1,
            hoursStudied: (currentStats.hoursStudied || 0) + (data.hoursEarned || 0),
          };
          localStorage.setItem("dashboardStats", JSON.stringify(updatedStats));
        }

        setIsCompleted(true);
        setCompletedDate(completedAt);

        toast.success("🎉 Course completed! Great job!", {
          duration: 4000,
          icon: "✅",
        });
      } else {
        toast.error(data.error || "Failed to mark course as complete");
      }
    } catch (error) {
      console.error("Error completing course:", error);
      toast.error("An error occurred while marking course as complete");
    } finally {
      setIsCompletingCourse(false);
    }
  };

  const handleDownloadMaterials = async () => {
    if (!course) return;

    // Check premium status (mock)
    if (!isPremium) {
      toast.error("⭐ Upgrade to Premium to download course materials", {
        duration: 4000,
        icon: "🔒",
      });
      return;
    }

    // Check if enrolled
    if (!isEnrolled) {
      toast.error("Please enroll in the course first to download materials", {
        duration: 3000,
      });
      return;
    }

    setIsDownloading(true);

    try {
      // Check if it's a YouTube playlist
      if (course.uploadType === "youtube" || course.link.includes("youtube.com")) {
        toast.success("📺 YouTube Playlist - Use external tools like youtube-dl to download", {
          duration: 5000,
          icon: "ℹ️",
        });
        setIsDownloading(false);
        return;
      }

      // For file-based courses, initiate download
      if (course.uploadType === "file" || course.link.startsWith("/")) {
        // Call API to get download URL
        const response = await fetch("/api/courses/download", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courseId: courseId,
            courseTitle: course.title,
            link: course.link,
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Trigger download
          const link = document.createElement("a");
          link.href = data.downloadUrl;
          link.download = data.fileName || `${course.title}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Show success with confetti
          toast.success("📥 Download started successfully!", {
            duration: 4000,
            icon: "✅",
          });

          // Optional: Trigger confetti animation
          setTimeout(() => {
            toast.success("🎉 Materials downloaded!", {
              duration: 2000,
            });
          }, 1000);
        } else {
          toast.error(data.error || "Failed to download materials");
        }
      } else {
        // For external links, open in new tab
        window.open(course.link, "_blank");
        toast.success("Opening course materials in new tab", {
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("An error occurred while downloading materials");
    } finally {
      setIsDownloading(false);
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Play className="w-5 h-5 text-red-400" />;
      case "pdf":
        return <FileText className="w-5 h-5 text-blue-400" />;
      case "link":
        return <LinkIcon className="w-5 h-5 text-purple-400" />;
      default:
        return <Download className="w-5 h-5 text-gray-400" />;
    }
  };

  // Extract YouTube playlist ID from URL
  const getYouTubePlaylistId = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get("list");
    } catch {
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading course details...</p>
        </motion.div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Courses
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden"
            >
              {course.thumbnail && (
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              )}

              <div className="p-8">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-3 mb-4"
                >
                  <span className="px-3 py-1 bg-purple-500/30 border border-purple-400 rounded-full text-purple-300 text-sm font-semibold">
                    {course.category}
                  </span>
                  <span className="px-3 py-1 bg-blue-500/30 border border-blue-400 rounded-full text-blue-300 text-sm font-semibold">
                    {course.level}
                  </span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl font-bold text-white mb-4"
                >
                  {course.title}
                </motion.h1>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-6 mb-6 text-gray-300"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    <span>{course.enrollmentCount.toLocaleString()} enrolled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <span>{course.rating.toFixed(1)} rating</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-400" />
                    <span>{course.views.toLocaleString()} views</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-3 text-gray-400 mb-6"
                >
                  <Award className="w-5 h-5" />
                  <span>Taught by {course.instructor}</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-3 text-gray-400"
                >
                  <Clock className="w-5 h-5" />
                  <span>{course.duration}</span>
                  <span className="text-gray-500">•</span>
                  <Calendar className="w-5 h-5" />
                  <span>Added {formatDistanceToNow(new Date(course.createdAt), { addSuffix: true })}</span>
                </motion.div>
              </div>
            </motion.div>

            {/* Course Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8"
            >
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-white mb-4 flex items-center gap-2"
              >
                <BookOpen className="w-6 h-6 text-purple-400" />
                About This Course
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-300 leading-relaxed"
              >
                {course.description}
              </motion.p>
            </motion.div>

            {/* YouTube Playlist Embed */}
            {course.uploadType === "youtube" && course.link && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8"
              >
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-2xl font-bold text-white mb-6 flex items-center gap-2"
                >
                  <Play className="w-6 h-6 text-red-400" />
                  Course Videos
                </motion.h2>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="relative w-full rounded-xl overflow-hidden"
                  style={{ paddingBottom: "56.25%" }}
                >
                  <iframe
                    src={`https://www.youtube.com/embed/videoseries?list=${getYouTubePlaylistId(course.link)}`}
                    title={course.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full rounded-xl"
                  />
                </motion.div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-gray-400 text-sm mt-4"
                >
                  Watch the complete playlist on YouTube. Click on the playlist button in the player to see all videos.
                </motion.p>
              </motion.div>
            )}

            {/* Course Materials */}
            {course.materials && course.materials.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8"
              >
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-400" />
                  Course Materials
                </h2>
                <div className="space-y-3">
                  {course.materials.map((material, index) => (
                    <motion.a
                      key={index}
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-purple-400/50 transition-all duration-300 group"
                    >
                      {getMaterialIcon(material.type)}
                      <span className="flex-1 text-white font-medium">{material.name}</span>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" />
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Download Materials Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-2xl border border-blue-400/30 p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Download className="w-6 h-6 text-blue-400" />
                Download Materials
              </h2>
              
              {course.materials && course.materials.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-gray-300 text-sm mb-4">
                    Download all course materials for offline access. Requires enrollment and premium membership.
                  </p>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDownloadMaterials}
                    disabled={isDownloading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isDownloading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Loader2 className="w-5 h-5" />
                        </motion.div>
                        Preparing Download...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        Download All Materials
                      </>
                    )}
                  </motion.button>

                  {!isPremium && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="flex items-center gap-2 text-yellow-400 text-sm"
                    >
                      <span>⭐</span>
                      <span>Premium feature - Upgrade to unlock downloads</span>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center p-6 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-gray-400 text-sm">No downloadable materials available</span>
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enrollment Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-gray-700/20 to-gray-800/20 backdrop-blur-xl rounded-2xl border border-gray-600/30 p-6 sticky top-6"
            >
              <div className="text-center mb-6">
                <p className="text-5xl font-bold text-white mb-2">FREE</p>
                <p className="text-gray-300 text-sm">No cost, unlimited access</p>
              </div>

              {isEnrolled ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500/30 border border-green-400 text-green-300 font-semibold rounded-xl">
                    <CheckCircle className="w-5 h-5" />
                    Enrolled
                  </div>
                  <a
                    href={course.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-center"
                  >
                    Start Learning
                  </a>

                  {/* Completion Section */}
                  <div className="pt-4 border-t border-white/20">
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 15,
                        }}
                        className="bg-gradient-to-br from-green-500/30 to-emerald-500/30 backdrop-blur-md rounded-xl p-4 border-2 border-green-400/50"
                      >
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <motion.div
                            initial={{ scale: 1.2, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            <CheckCircle className="w-6 h-6 text-green-400" />
                          </motion.div>
                          <span className="text-white font-bold">Completed!</span>
                        </div>
                        <p className="text-center text-gray-300 text-sm">
                          Completed on{" "}
                          {completedDate
                            ? new Date(completedDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "Unknown date"}
                        </p>
                      </motion.div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleMarkComplete}
                        disabled={isCompletingCourse}
                        className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isCompletingCourse ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Marking Complete...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Mark as Completed
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleEnroll}
                  className="w-full px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Enroll Now
                </motion.button>
              )}

              <div className="mt-6 pt-6 border-t border-white/20 space-y-3">
                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-sm">Course Type:</span>
                  <span className="font-semibold text-white capitalize">{course.uploadType}</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-sm">Duration:</span>
                  <span className="font-semibold text-white">{course.duration}</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-sm">Level:</span>
                  <span className="font-semibold text-white">{course.level}</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-sm">Materials:</span>
                  <span className="font-semibold text-white">{course.materials.length} items</span>
                </div>
              </div>
            </motion.div>

            {/* Stats Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6"
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Course Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Total Enrollments</span>
                  <span className="text-white font-bold">{course.enrollmentCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Average Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-white font-bold">{course.rating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Total Views</span>
                  <span className="text-white font-bold">{course.views.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
