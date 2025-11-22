"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  BookOpen, 
  Upload, 
  Link as LinkIcon, 
  FileText, 
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import toast from "react-hot-toast";

export default function CreateCoursePage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [uploadType, setUploadType] = useState<"link" | "file">("link");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Validation errors
  const [errors, setErrors] = useState({
    title: "",
    description: "",
    link: "",
  });

  // Mock admin check (replace with real auth)
  useEffect(() => {
    // Simulate auth check
    const checkAdmin = () => {
      // Mock: Set to true for development
      // In production: const user = useAuth(); if (user?.role !== 'admin') redirect
      const mockIsAdmin = true; // Change to false to test redirect
      
      if (!mockIsAdmin) {
        toast.error("Access denied. Admin privileges required.");
        router.push("/dashboard");
        return;
      }
      
      setIsAdmin(true);
      setIsLoading(false);
    };

    setTimeout(checkAdmin, 500);
  }, [router]);

  // Validate URL format
  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors = {
      title: "",
      description: "",
      link: "",
    };

    let isValid = true;

    // Title validation
    if (title.trim().length < 5) {
      newErrors.title = "Title must be at least 5 characters";
      isValid = false;
    }

    // Description validation
    if (description.trim().length < 20) {
      newErrors.description = "Description must be at least 20 characters";
      isValid = false;
    }

    // Link/File validation
    if (uploadType === "link") {
      if (linkUrl.trim().length === 0) {
        newErrors.link = "Please provide a course link";
        isValid = false;
      } else if (!isValidUrl(linkUrl.trim())) {
        newErrors.link = "Please enter a valid URL (must start with http:// or https://)";
        isValid = false;
      }
    } else {
      if (!selectedFile) {
        newErrors.link = "Please select a file to upload";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      // Validate file type
      const allowedTypes = ["application/pdf", "video/mp4", "video/webm", "application/zip"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("File type not supported. Use PDF, MP4, WEBM, or ZIP files.");
        return;
      }

      setSelectedFile(file);
      setErrors({ ...errors, link: "" });
    }
  };

  // Simulate file upload
  const uploadFile = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          // Mock URL
          const mockUrl = `https://cdn.studybuddy.com/courses/${Date.now()}_${file.name}`;
          resolve(mockUrl);
        }
      }, 200);
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      let finalLink = linkUrl.trim();

      // Handle file upload
      if (uploadType === "file" && selectedFile) {
        toast.loading("Uploading file...", { id: "upload" });
        finalLink = await uploadFile(selectedFile);
        toast.success("File uploaded successfully!", { id: "upload" });
      }

      // Submit to API
      const response = await fetch("/api/courses/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          link: finalLink,
          uploadType,
          fileName: selectedFile?.name,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Save to localStorage
        const existingCourses = JSON.parse(
          localStorage.getItem("studybuddy_courses") || "[]"
        );
        existingCourses.push(data.course);
        localStorage.setItem("studybuddy_courses", JSON.stringify(existingCourses));

        toast.success("🎉 Course added successfully!", {
          duration: 4000,
          icon: "📚",
        });
        
        // Reset form
        setTitle("");
        setDescription("");
        setLinkUrl("");
        setSelectedFile(null);
        setUploadProgress(0);
        
        // Redirect after delay
        setTimeout(() => {
          router.push("/admin/courses");
        }, 1500);
      } else {
        toast.error(data.error || "Failed to create course");
      }
    } catch (error) {
      console.error("Course creation error:", error);
      toast.error("An error occurred while creating the course");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Container animation variants
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

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
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
          <p className="text-white text-lg">Verifying admin access...</p>
        </motion.div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Create New Course</h1>
              <p className="text-gray-300 mt-1">Add educational content to StudyBuddy</p>
            </div>
          </div>
        </motion.div>

        {/* Form Card */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Input */}
            <motion.div variants={itemVariants}>
              <label className="block text-white font-semibold mb-2">
                Course Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors({ ...errors, title: "" });
                }}
                placeholder="e.g., Advanced React Patterns & Best Practices"
                className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.title
                    ? "border-red-500 focus:ring-red-500"
                    : "border-white/20 focus:ring-purple-500"
                }`}
                disabled={isSubmitting}
              />
              {errors.title && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm mt-2 flex items-center gap-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.title}
                </motion.p>
              )}
              <p className="text-gray-400 text-sm mt-1">
                {title.length}/5 characters minimum
              </p>
            </motion.div>

            {/* Description Textarea */}
            <motion.div variants={itemVariants}>
              <label className="block text-white font-semibold mb-2">
                Course Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors({ ...errors, description: "" });
                }}
                placeholder="Provide a detailed description of the course content, learning objectives, and what students will gain..."
                rows={6}
                className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all resize-none ${
                  errors.description
                    ? "border-red-500 focus:ring-red-500"
                    : "border-white/20 focus:ring-purple-500"
                }`}
                disabled={isSubmitting}
              />
              {errors.description && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm mt-2 flex items-center gap-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.description}
                </motion.p>
              )}
              <p className="text-gray-400 text-sm mt-1">
                {description.length}/20 characters minimum
              </p>
            </motion.div>

            {/* Upload Type Selector */}
            <motion.div variants={itemVariants}>
              <label className="block text-white font-semibold mb-3">
                Course Content Source *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setUploadType("link");
                    setSelectedFile(null);
                    setErrors({ ...errors, link: "" });
                  }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    uploadType === "link"
                      ? "border-purple-500 bg-purple-500/20"
                      : "border-white/20 bg-white/5 hover:bg-white/10"
                  }`}
                  disabled={isSubmitting}
                >
                  <LinkIcon className={`w-6 h-6 mx-auto mb-2 ${
                    uploadType === "link" ? "text-purple-400" : "text-gray-400"
                  }`} />
                  <p className={`font-semibold ${
                    uploadType === "link" ? "text-purple-300" : "text-gray-300"
                  }`}>
                    External Link
                  </p>
                  <p className="text-xs text-gray-400 mt-1">YouTube, Coursera, etc.</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUploadType("file");
                    setLinkUrl("");
                    setErrors({ ...errors, link: "" });
                  }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    uploadType === "file"
                      ? "border-purple-500 bg-purple-500/20"
                      : "border-white/20 bg-white/5 hover:bg-white/10"
                  }`}
                  disabled={isSubmitting}
                >
                  <Upload className={`w-6 h-6 mx-auto mb-2 ${
                    uploadType === "file" ? "text-purple-400" : "text-gray-400"
                  }`} />
                  <p className={`font-semibold ${
                    uploadType === "file" ? "text-purple-300" : "text-gray-300"
                  }`}>
                    Upload File
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF, Video, ZIP (max 10MB)</p>
                </button>
              </div>
            </motion.div>

            {/* Link Input or File Upload */}
            <motion.div variants={itemVariants}>
              {uploadType === "link" ? (
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Course URL *
                  </label>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => {
                      setLinkUrl(e.target.value);
                      if (errors.link) setErrors({ ...errors, link: "" });
                    }}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                      errors.link
                        ? "border-red-500 focus:ring-red-500"
                        : "border-white/20 focus:ring-purple-500"
                    }`}
                    disabled={isSubmitting}
                  />
                  {errors.link && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-sm mt-2 flex items-center gap-1"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {errors.link}
                    </motion.p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Upload Course File *
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      accept=".pdf,.mp4,.webm,.zip"
                      className="hidden"
                      id="course-file-upload"
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor="course-file-upload"
                      className={`block w-full px-4 py-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                        errors.link
                          ? "border-red-500 bg-red-500/10"
                          : "border-white/30 bg-white/5 hover:bg-white/10 hover:border-purple-400"
                      }`}
                    >
                      <div className="text-center">
                        {selectedFile ? (
                          <div className="space-y-2">
                            <FileText className="w-8 h-8 text-green-400 mx-auto" />
                            <p className="text-white font-semibold">{selectedFile.name}</p>
                            <p className="text-gray-400 text-sm">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                            {uploadProgress > 0 && uploadProgress < 100 && (
                              <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${uploadProgress}%` }}
                                  className="bg-gradient-to-r from-gray-600 to-gray-700 h-2 rounded-full"
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-white font-semibold">Click to upload file</p>
                            <p className="text-gray-400 text-sm mt-1">
                              PDF, MP4, WEBM, or ZIP (max 10MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                  {errors.link && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-sm mt-2 flex items-center gap-1"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {errors.link}
                    </motion.p>
                  )}
                </div>
              )}
            </motion.div>

            {/* Submit Button */}
            <motion.div variants={itemVariants} className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-300 border border-white/20"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Course...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Create Course
                  </>
                )}
              </button>
            </motion.div>
          </form>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-6 bg-blue-500/10 backdrop-blur-md rounded-xl p-6 border border-blue-400/30"
        >
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-400" />
            Course Creation Guidelines
          </h3>
          <ul className="text-gray-300 text-sm space-y-2">
            <li>• Use descriptive titles that clearly indicate the course topic</li>
            <li>• Provide comprehensive descriptions with learning objectives</li>
            <li>• Ensure external links are accessible and properly formatted</li>
            <li>• Uploaded files should be high-quality and well-organized</li>
            <li>• All courses are reviewed before being made available to students</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
