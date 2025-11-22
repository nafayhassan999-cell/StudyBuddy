"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Flag, Send, AlertTriangle, CheckCircle2, X } from "lucide-react";
import Navbar from "@/components/Navbar";

interface Report {
  id: string;
  type: string;
  description: string;
  status: "pending" | "reviewed" | "resolved";
  createdAt: Date;
}

export default function ReportPage() {
  const [reportType, setReportType] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [myReports, setMyReports] = useState<Report[]>([]);

  const reportTypes = [
    { value: "inappropriate", label: "Inappropriate Content" },
    { value: "spam", label: "Spam or Misleading" },
    { value: "harassment", label: "Harassment or Bullying" },
    { value: "violence", label: "Violence or Threats" },
    { value: "copyright", label: "Copyright Violation" },
    { value: "privacy", label: "Privacy Violation" },
    { value: "other", label: "Other" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reportType || !description.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add to local reports list
      const newReport: Report = {
        id: Date.now().toString(),
        type: reportType,
        description: description,
        status: "pending",
        createdAt: new Date(),
      };
      
      setMyReports([newReport, ...myReports]);
      setShowSuccess(true);
      setReportType("");
      setDescription("");
      
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error submitting report:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: Report["status"]) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30";
      case "reviewed":
        return "text-blue-600 bg-blue-100 dark:bg-blue-900/30";
      case "resolved":
        return "text-green-600 bg-green-100 dark:bg-green-900/30";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-900/30";
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-gray-600/20 to-gray-700/20 rounded-xl">
                <Flag className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Report Content
            </h1>
            <p className="text-gray-400 text-lg">
              Help us maintain a safe and respectful community
            </p>
          </motion.div>

          {/* Success Message */}
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <p className="text-green-400 font-medium">
                Report submitted successfully! We&apos;ll review it shortly.
              </p>
            </motion.div>
          )}

          {/* Report Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              Submit a Report
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Report Type *
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
                >
                  <option value="" className="bg-gray-800">Select a type...</option>
                  {reportTypes.map((type) => (
                    <option key={type.value} value={type.value} className="bg-gray-800">
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={6}
                  placeholder="Please provide details about what you're reporting..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Be as specific as possible to help us understand the issue
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !reportType || !description.trim()}
                className="w-full px-6 py-4 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Report
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* My Reports */}
          {myReports.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                My Reports
              </h2>

              <div className="space-y-4">
                {myReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-sm font-semibold text-gray-300 capitalize">
                          {report.type.replace("-", " ")}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {report.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(
                          report.status
                        )}`}
                      >
                        {report.status}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm line-clamp-2">
                      {report.description}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Guidelines */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6"
          >
            <h3 className="text-lg font-bold text-blue-400 mb-3">
              Reporting Guidelines
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Only report content that violates our community guidelines</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Provide specific details to help us investigate</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>False reports may result in account suspension</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>We review all reports within 24-48 hours</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </main>
    </>
  );
}
