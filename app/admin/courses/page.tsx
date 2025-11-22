"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  BookOpen, 
  Plus, 
  Users, 
  Eye, 
  Star,
  Calendar,
  Link as LinkIcon,
  FileText,
  Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Course {
  id: string;
  title: string;
  description: string;
  link: string;
  uploadType: "link" | "file";
  fileName?: string;
  createdAt: string;
  enrollmentCount: number;
  rating: number;
  views: number;
}

export default function AdminCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load courses from localStorage
    const loadCourses = () => {
      const storedCourses = localStorage.getItem("studybuddy_courses");
      if (storedCourses) {
        setCourses(JSON.parse(storedCourses));
      }
      setIsLoading(false);
    };

    setTimeout(loadCourses, 500);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading courses...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Course Management</h1>
              <p className="text-gray-300 mt-1">{courses.length} courses available</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/admin/courses/create")}
            className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Course
          </motion.button>
        </motion.div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-12 text-center"
          >
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">No courses yet</h3>
            <p className="text-gray-300 mb-6">Create your first course to get started</p>
            <button
              onClick={() => router.push("/admin/courses/create")}
              className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Course
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2 rounded-lg ${
                    course.uploadType === "link" 
                      ? "bg-blue-500/20" 
                      : "bg-green-500/20"
                  }`}>
                    {course.uploadType === "link" ? (
                      <LinkIcon className="w-5 h-5 text-blue-400" />
                    ) : (
                      <FileText className="w-5 h-5 text-green-400" />
                    )}
                  </div>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDistanceToNow(new Date(course.createdAt), { addSuffix: true })}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                  {course.description}
                </p>

                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div className="bg-white/5 rounded-lg p-2">
                    <Users className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                    <p className="text-white font-semibold text-sm">{course.enrollmentCount}</p>
                    <p className="text-gray-400 text-xs">Enrolled</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <Eye className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                    <p className="text-white font-semibold text-sm">{course.views}</p>
                    <p className="text-gray-400 text-xs">Views</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <Star className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                    <p className="text-white font-semibold text-sm">{course.rating.toFixed(1)}</p>
                    <p className="text-gray-400 text-xs">Rating</p>
                  </div>
                </div>

                <a
                  href={course.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-2 bg-gradient-to-r from-gray-600/20 to-gray-700/20 hover:from-gray-600/30 hover:to-gray-700/30 text-white text-center font-semibold rounded-lg transition-all duration-300 border border-gray-500/30"
                >
                  View Course
                </a>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
