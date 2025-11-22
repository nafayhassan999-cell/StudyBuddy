"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Send, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'user' | 'message' | 'group';
  targetId: string;
  targetUserId?: string;
  targetUserName?: string;
  targetContent?: string;
}

const REPORT_REASONS = [
  'Spam',
  'Harassment',
  'Inappropriate Content',
  'Off-topic',
  'Misinformation',
  'Impersonation',
  'Other',
];

export default function ReportModal({
  isOpen,
  onClose,
  type,
  targetId,
  targetUserId,
  targetUserName,
  targetContent,
}: ReportModalProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setDescription('');
    }
  }, [isOpen]);

  // Check rate limit
  const checkRateLimit = (): boolean => {
    const today = new Date().toDateString();
    const reportData = localStorage.getItem('userReports');
    const reports = reportData ? JSON.parse(reportData) : { date: today, count: 0 };

    // Reset count if it's a new day
    if (reports.date !== today) {
      reports.date = today;
      reports.count = 0;
    }

    // Check if user has exceeded limit
    if (reports.count >= 5) {
      toast.error('You have reached the daily report limit (5 reports/day). Please try again tomorrow.', {
        icon: '⏳',
        duration: 4000,
      });
      return false;
    }

    return true;
  };

  // Increment report count
  const incrementReportCount = () => {
    const today = new Date().toDateString();
    const reportData = localStorage.getItem('userReports');
    const reports = reportData ? JSON.parse(reportData) : { date: today, count: 0 };

    if (reports.date !== today) {
      reports.date = today;
      reports.count = 0;
    }

    reports.count += 1;
    localStorage.setItem('userReports', JSON.stringify(reports));
  };

  // Check for self-report
  const isSelfReport = (): boolean => {
    if (type === 'user' && targetUserId === user?.email) {
      toast.error('You cannot report yourself!', {
        icon: '🚫',
        duration: 3000,
      });
      return true;
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!reason) {
      toast.error('Please select a reason for reporting');
      return;
    }

    if (isSelfReport()) {
      return;
    }

    if (!checkRateLimit()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          id: targetId,
          targetUserId,
          targetUserName,
          reason,
          description,
          reportedBy: user?.email || 'anonymous',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store report locally for user's history
        const localReports = JSON.parse(localStorage.getItem('myReports') || '[]');
        localReports.push({
          id: data.reportId,
          type,
          targetId,
          reason,
          timestamp: new Date().toISOString(),
        });
        localStorage.setItem('myReports', JSON.stringify(localReports));

        // Increment rate limit counter
        incrementReportCount();

        // Show success message
        toast.success('Report submitted - Thank you for keeping the community safe! 🛡️', {
          icon: '✅',
          duration: 4000,
        });

        // Admin notification (simulated)
        if (data.warning) {
          setTimeout(() => {
            toast('Admin has been notified. Reviewing case...', {
              icon: '👮',
              duration: 3000,
            });
          }, 1000);
        }

        onClose();
      } else {
        throw new Error(data.error || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Report submission error:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'user':
        return `User: ${targetUserName || 'Unknown'}`;
      case 'message':
        return 'Message';
      case 'group':
        return 'Group';
      default:
        return 'Content';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-gray-900 via-red-900/20 to-orange-900/20 backdrop-blur-xl rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl border border-red-500/30 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-xl">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Report Content</h2>
                    <p className="text-sm text-gray-400">Help us keep the community safe</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Target Info */}
              <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-sm text-gray-400 mb-1">Reporting:</p>
                <p className="text-white font-semibold">{getTypeLabel()}</p>
                {targetContent && (
                  <p className="text-sm text-gray-300 mt-2 line-clamp-2 italic">
                    &ldquo;{targetContent}&rdquo;
                  </p>
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Reason Dropdown */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Reason for Report <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  >
                    <option value="" className="bg-gray-900">Select a reason</option>
                    {REPORT_REASONS.map((r) => (
                      <option key={r} value={r} className="bg-gray-900">
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description Textarea */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Additional Details <span className="text-gray-500">(Optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide more context to help us understand the issue..."
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {description.length}/500 characters
                  </p>
                </div>

                {/* Info Banner */}
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-300 font-semibold mb-1">
                        Anonymous Reporting
                      </p>
                      <p className="text-xs text-gray-400">
                        Your report is confidential. The reported user will not know who submitted it.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !reason}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Send className="w-5 h-5" />
                        </motion.div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Submit Report
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Rate Limit Info */}
              <p className="text-xs text-gray-500 text-center mt-4">
                Daily limit: 5 reports per day
              </p>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
