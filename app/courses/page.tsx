"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Search,
  Loader2,
  Users,
  Star,
  Clock,
  ArrowRight,
  Filter,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";
import ChartWrapper from "@/components/ChartWrapper";

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
  thumbnail?: string;
  instructor: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  totalPages: number;
}

// Course Card Component with InView animation
function CourseCard({ course, index }: { course: Course; index: number }) {
  const router = useRouter();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-300 group"
    >
      {/* Thumbnail */}
      {course.thumbnail && (
        <div className="relative h-48 overflow-hidden rounded-t-xl">
          <motion.img
            src={course.thumbnail}
            alt={course.title}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-3 right-3 px-3 py-1 bg-purple-500/90 backdrop-blur-sm rounded-full text-white text-xs font-semibold">
            {course.level}
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Category & Duration */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-purple-300 font-semibold bg-purple-500/20 px-2 py-1 rounded">
            {course.category}
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {course.duration}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
          {course.title}
        </h3>

        {/* Description */}
        <p className="text-gray-300 text-sm mb-4 line-clamp-3">{course.description}</p>

        {/* Instructor */}
        <p className="text-gray-400 text-xs mb-4">By {course.instructor}</p>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1 text-gray-300">
            <Users className="w-4 h-4 text-purple-400" />
            <span>{course.enrollmentCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-300">
            <Star className="w-4 h-4 text-yellow-400" />
            <span>{course.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* View Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push(`/courses/${course.id}`)}
          className="w-full px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group"
        >
          View Course
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch courses
  const fetchCourses = async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const response = await fetch(`/api/courses?page=${page}&limit=10`);
      const data = await response.json();

      if (data.success) {
        if (append) {
          setCourses((prev) => [...prev, ...data.courses]);
          setFilteredCourses((prev) => [...prev, ...data.courses]);
        } else {
          setCourses(data.courses);
          setFilteredCourses(data.courses);
        }
        setPagination(data.pagination);
        setCurrentPage(page);
      } else {
        toast.error("Failed to load courses");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("An error occurred while loading courses");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Search filter
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCourses(courses);
    } else {
      const filtered = courses.filter((course) =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCourses(filtered);
    }
  }, [searchQuery, courses]);

  // Load more handler
  const handleLoadMore = () => {
    if (pagination?.hasMore) {
      fetchCourses(currentPage + 1, true);
    }
  };

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  // Mock data for the chart
  const progressData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    datasets: [
      {
        label: 'Learning Hours',
        data: [2, 4.5, 3, 6, 5.5, 8],
        borderColor: 'rgba(168, 85, 247, 1)', // purple-500
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgba(168, 85, 247, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Courses Completed',
        data: [0, 1, 1, 2, 2, 3],
        borderColor: 'rgba(59, 130, 246, 1)', // blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ],
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
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Browse Courses</h1>
              <p className="text-gray-300 mt-1">
                {pagination?.total || 0} free courses available
              </p>
            </div>
          </div>

          {/* Learning Progress Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl"
          >
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Learning Trends</h2>
            </div>
            <div className="h-64 w-full">
              <ChartWrapper
                type="line"
                data={progressData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: { color: '#e5e7eb' }
                    },
                    tooltip: {
                      mode: 'index',
                      intersect: false,
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: { color: 'rgba(255, 255, 255, 0.05)' },
                      ticks: { color: '#9ca3af' }
                    },
                    x: {
                      grid: { display: false },
                      ticks: { color: '#9ca3af' }
                    }
                  }
                }}
              />
            </div>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses by title, description, or category..."
              className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            />
            {searchQuery && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
              >
                {filteredCourses.length} result{filteredCourses.length !== 1 ? "s" : ""}
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-12 text-center"
          >
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <BookOpen className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {searchQuery ? "No courses found" : "No courses yet"}
            </h3>
            <p className="text-gray-300 mb-6">
              {searchQuery
                ? `No courses match "${searchQuery}". Try a different search term.`
                : "Check back soon for new courses!"}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Clear Search
              </button>
            )}
          </motion.div>
        ) : (
          <>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredCourses.map((course, index) => (
                <CourseCard key={course.id} course={course} index={index} />
              ))}
            </motion.div>

            {/* Load More Button */}
            {pagination?.hasMore && !searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-12 text-center"
              >
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading more courses...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-5 h-5" />
                      Load More Courses
                    </>
                  )}
                </button>
                <p className="text-gray-400 text-sm mt-3">
                  Showing {filteredCourses.length} of {pagination.total} courses
                </p>
              </motion.div>
            )}
          </>
        )}

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-gradient-to-br from-gray-700/20 to-gray-800/20 backdrop-blur-xl rounded-2xl border border-gray-600/30 p-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="w-8 h-8 text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                {pagination?.total || 0}
              </p>
              <p className="text-gray-300 text-sm">Total Courses</p>
            </div>
            <div>
              <div className="flex items-center justify-center mb-2">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                {courses.reduce((sum, c) => sum + c.enrollmentCount, 0).toLocaleString()}
              </p>
              <p className="text-gray-300 text-sm">Total Enrollments</p>
            </div>
            <div>
              <div className="flex items-center justify-center mb-2">
                <Star className="w-8 h-8 text-yellow-400" />
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                {courses.length > 0
                  ? (
                      courses.reduce((sum, c) => sum + c.rating, 0) / courses.length
                    ).toFixed(1)
                  : "0.0"}
              </p>
              <p className="text-gray-300 text-sm">Average Rating</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
