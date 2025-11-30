"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import AnimatedPage from "@/components/AnimatedPage";
import FlashcardModal from "@/components/FlashcardModal";
import QuizModal from "@/components/QuizModal";
import StudyPlanGenerator from "@/components/StudyPlanGenerator";
import { motion } from "framer-motion";
import { Flame, Clock, Target, Users, Bot, BookOpen, TrendingUp, Send, Copy, Check, Sparkles, Brain, FileText, Upload, Save, X, Award, Trophy, Star, Zap, BarChart3, Download, Calendar, TrendingDown, Loader2, AlertTriangle, GraduationCap, Lightbulb } from "lucide-react";
import toast from "react-hot-toast";
import ChartWrapper from "@/components/ChartWrapper";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "ai";
  text: string;
}

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  // Modal states
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  
  // AI Tutor state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Document summarization state
  const [isUploading, setIsUploading] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [summaryFileName, setSummaryFileName] = useState<string>("");
  const [copiedSummary, setCopiedSummary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Streak state
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [streakAnimation, setStreakAnimation] = useState(false);

  // Badges state
  const [badges, setBadges] = useState<any[]>([]);
  const [earnedBadgeId, setEarnedBadgeId] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [quizCount, setQuizCount] = useState(0);
  const [aiUsageCount, setAiUsageCount] = useState(0);
  const [docSummarizeCount, setDocSummarizeCount] = useState(0);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Warning state (check if user has been reported)
  const [hasWarning, setHasWarning] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  // Initialize and check streak on load
  useEffect(() => {
    const initializeStreak = () => {
      const streakData = localStorage.getItem('streak');
      const today = new Date().toDateString();
      
      if (!streakData) {
        // First time user
        const initialStreak = {
          current: 1,
          best: 1,
          lastDate: today,
        };
        localStorage.setItem('streak', JSON.stringify(initialStreak));
        setCurrentStreak(1);
        setBestStreak(1);
        return;
      }

      const streak = JSON.parse(streakData);
      const lastDate = new Date(streak.lastDate);
      const todayDate = new Date(today);
      const yesterday = new Date(todayDate);
      yesterday.setDate(yesterday.getDate() - 1);

      // Check if user already logged activity today
      if (lastDate.toDateString() === today) {
        // Already logged today
        setCurrentStreak(streak.current);
        setBestStreak(streak.best);
      } else if (lastDate.toDateString() === yesterday.toDateString()) {
        // Last activity was yesterday - maintain streak but don't auto-increment
        // Will increment when user logs activity
        setCurrentStreak(streak.current);
        setBestStreak(streak.best);
      } else {
        // Missed a day - reset streak
        const resetStreak = {
          current: 0,
          best: streak.best,
          lastDate: streak.lastDate,
        };
        localStorage.setItem('streak', JSON.stringify(resetStreak));
        setCurrentStreak(0);
        setBestStreak(streak.best);
        toast.error('Your study streak was reset! Start a new one today! 🔥', {
          duration: 4000,
        });
      }
    };

    if (isAuthenticated) {
      initializeStreak();
    }
  }, [isAuthenticated]);

  // Initialize badges on load
  useEffect(() => {
    const initializeBadges = () => {
      const storedBadges = localStorage.getItem('badges');
      const storedSessionCount = localStorage.getItem('sessionCount');
      const storedQuizCount = localStorage.getItem('quizCount');
      const storedAiUsageCount = localStorage.getItem('aiUsageCount');
      const storedDocSummarizeCount = localStorage.getItem('docSummarizeCount');

      if (storedSessionCount) {
        setSessionCount(parseInt(storedSessionCount));
      }
      if (storedQuizCount) {
        setQuizCount(parseInt(storedQuizCount));
      }
      if (storedAiUsageCount) {
        setAiUsageCount(parseInt(storedAiUsageCount));
      }
      if (storedDocSummarizeCount) {
        setDocSummarizeCount(parseInt(storedDocSummarizeCount));
      }

      if (!storedBadges) {
        // Initialize default badges
        const defaultBadges = [
          {
            id: '1',
            name: 'First Steps',
            desc: 'Complete your first quiz',
            earned: false,
            icon: 'Brain',
            color: 'from-blue-400 to-blue-600',
          },
          {
            id: '2',
            name: 'AI Enthusiast',
            desc: 'Use AI Tutor 5 times',
            earned: false,
            icon: 'Bot',
            color: 'from-gray-600 to-gray-800',
          },
          {
            id: '3',
            name: 'Fire Starter',
            desc: 'Reach a 5-day streak',
            earned: false,
            icon: 'Flame',
            color: 'from-orange-400 to-red-600',
          },
          {
            id: '4',
            name: 'Dedicated Scholar',
            desc: 'Reach a 30-day streak',
            earned: false,
            icon: 'Award',
            color: 'from-yellow-400 to-yellow-600',
          },
          {
            id: '5',
            name: 'Social Butterfly',
            desc: 'Attend 10 study sessions',
            earned: false,
            icon: 'Users',
            color: 'from-green-400 to-green-600',
          },
          {
            id: '6',
            name: 'Quiz Master',
            desc: 'Complete 10 quizzes',
            earned: false,
            icon: 'Target',
            color: 'from-gray-500 to-gray-700',
          },
          {
            id: '7',
            name: 'Document Wizard',
            desc: 'Summarize 5 documents',
            earned: false,
            icon: 'FileText',
            color: 'from-indigo-400 to-indigo-600',
          },
          {
            id: '8',
            name: 'Legendary',
            desc: 'Reach a 100-day streak',
            earned: false,
            icon: 'Sparkles',
            color: 'from-amber-400 to-amber-600',
          },
        ];
        localStorage.setItem('badges', JSON.stringify(defaultBadges));
        setBadges(defaultBadges);
      } else {
        setBadges(JSON.parse(storedBadges));
      }
    };

    if (isAuthenticated) {
      initializeBadges();
    }
  }, [isAuthenticated]);

  // Load analytics data
  useEffect(() => {
    const loadAnalyticsData = () => {
      setIsLoadingAnalytics(true);

      // Get quiz history from localStorage
      const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
      
      // Generate mock session data
      const mockSessions = [
        { date: '2024-11-10', duration: 2.5, topic: 'Mathematics Study Group', attendees: 5 },
        { date: '2024-11-08', duration: 1.8, topic: 'Physics Problem Solving', attendees: 4 },
        { date: '2024-11-05', duration: 3.2, topic: 'Chemistry Lab Review', attendees: 6 },
        { date: '2024-11-03', duration: 2.0, topic: 'History Discussion', attendees: 3 },
        { date: '2024-11-01', duration: 1.5, topic: 'Computer Science Project', attendees: 4 },
      ];

      // Calculate analytics
      const avgScore = quizzes.length > 0 
        ? Math.round(quizzes.reduce((sum: number, q: any) => sum + q.percentage, 0) / quizzes.length)
        : 0;

      const totalSessions = sessionCount || mockSessions.length;
      const avgTime = mockSessions.reduce((sum, s) => sum + s.duration, 0) / mockSessions.length;

      // Identify weakest topic (mock logic)
      const topicScores: Record<string, number[]> = {};
      quizzes.forEach((quiz: any) => {
        if (!topicScores[quiz.topic]) {
          topicScores[quiz.topic] = [];
        }
        topicScores[quiz.topic].push(quiz.percentage);
      });

      let weakestTopic = 'General';
      let lowestAvg = 100;

      Object.entries(topicScores).forEach(([topic, scores]) => {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (avg < lowestAvg) {
          lowestAvg = avg;
          weakestTopic = topic;
        }
      });

      const analyticsData = {
        quizzes: quizzes.slice(-10).map((q: any) => ({
          date: new Date(q.completedAt).toLocaleDateString(),
          score: q.percentage,
          topic: q.topic,
        })),
        sessions: mockSessions,
        avgScore,
        avgTime: avgTime.toFixed(1),
        totalSessions,
        weakestTopic,
        insight: avgScore >= 80 
          ? `Excellent performance! Keep up the great work! 🎉`
          : avgScore >= 60
          ? `Good progress! Consider reviewing ${weakestTopic} for improvement.`
          : `Focus on ${weakestTopic} to boost your scores. You've got this! 💪`,
      };

      setAnalyticsData(analyticsData);
      setIsLoadingAnalytics(false);
    };

    if (isAuthenticated) {
      loadAnalyticsData();
    }
  }, [isAuthenticated, quizCount, sessionCount]);

  // Check for warnings
  useEffect(() => {
    const warnings = localStorage.getItem('userWarnings');
    if (warnings) {
      const warningData = JSON.parse(warnings);
      const recentWarnings = warningData.filter((w: any) => {
        const warningDate = new Date(w.timestamp);
        const daysSince = (Date.now() - warningDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince < 30; // Show warnings from last 30 days
      });
      setHasWarning(recentWarnings.length > 0);
    }
  }, []);

  // Check and award badges based on conditions
  useEffect(() => {
    if (!isAuthenticated || badges.length === 0) return;

    const checkAndAwardBadges = () => {
      let badgesUpdated = false;
      const updatedBadges = [...badges];

      // Check for 5-day streak badge
      if (currentStreak >= 5 && !updatedBadges.find(b => b.id === '3')?.earned) {
        const badgeIndex = updatedBadges.findIndex(b => b.id === '3');
        if (badgeIndex !== -1) {
          updatedBadges[badgeIndex].earned = true;
          badgesUpdated = true;
          awardBadge(updatedBadges[badgeIndex]);
        }
      }

      // Check for 30-day streak badge
      if (currentStreak >= 30 && !updatedBadges.find(b => b.id === '4')?.earned) {
        const badgeIndex = updatedBadges.findIndex(b => b.id === '4');
        if (badgeIndex !== -1) {
          updatedBadges[badgeIndex].earned = true;
          badgesUpdated = true;
          awardBadge(updatedBadges[badgeIndex]);
        }
      }

      // Check for 100-day streak badge
      if (currentStreak >= 100 && !updatedBadges.find(b => b.id === '8')?.earned) {
        const badgeIndex = updatedBadges.findIndex(b => b.id === '8');
        if (badgeIndex !== -1) {
          updatedBadges[badgeIndex].earned = true;
          badgesUpdated = true;
          awardBadge(updatedBadges[badgeIndex]);
        }
      }

      // Check for 10 sessions badge
      if (sessionCount >= 10 && !updatedBadges.find(b => b.id === '5')?.earned) {
        const badgeIndex = updatedBadges.findIndex(b => b.id === '5');
        if (badgeIndex !== -1) {
          updatedBadges[badgeIndex].earned = true;
          badgesUpdated = true;
          awardBadge(updatedBadges[badgeIndex]);
        }
      }

      // Check for 10 quizzes badge
      if (quizCount >= 10 && !updatedBadges.find(b => b.id === '6')?.earned) {
        const badgeIndex = updatedBadges.findIndex(b => b.id === '6');
        if (badgeIndex !== -1) {
          updatedBadges[badgeIndex].earned = true;
          badgesUpdated = true;
          awardBadge(updatedBadges[badgeIndex]);
        }
      }

      // Check for AI Enthusiast badge (5 AI uses)
      if (aiUsageCount >= 5 && !updatedBadges.find(b => b.id === '2')?.earned) {
        const badgeIndex = updatedBadges.findIndex(b => b.id === '2');
        if (badgeIndex !== -1) {
          updatedBadges[badgeIndex].earned = true;
          badgesUpdated = true;
          awardBadge(updatedBadges[badgeIndex]);
        }
      }

      // Check for Document Wizard badge (5 summaries)
      if (docSummarizeCount >= 5 && !updatedBadges.find(b => b.id === '7')?.earned) {
        const badgeIndex = updatedBadges.findIndex(b => b.id === '7');
        if (badgeIndex !== -1) {
          updatedBadges[badgeIndex].earned = true;
          badgesUpdated = true;
          awardBadge(updatedBadges[badgeIndex]);
        }
      }

      if (badgesUpdated) {
        localStorage.setItem('badges', JSON.stringify(updatedBadges));
        setBadges(updatedBadges);
      }
    };

    checkAndAwardBadges();
  }, [currentStreak, sessionCount, quizCount, aiUsageCount, docSummarizeCount, badges, isAuthenticated]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Function to award badge with animation and confetti
  const awardBadge = (badge: any) => {
    setEarnedBadgeId(badge.id);
    
    // Confetti celebration
    setTimeout(() => {
      const { confetti } = require('party-js');
      confetti(document.body, {
        count: 50,
        spread: 60,
      });
    }, 300);

    // Success toast
    toast.success(`🏆 Badge Earned: ${badge.name}!`, {
      duration: 4000,
      icon: '🎖️',
    });

    // Reset animation after delay
    setTimeout(() => {
      setEarnedBadgeId(null);
    }, 2000);
  };

  // Function to increment quiz count
  const incrementQuizCount = () => {
    const newCount = quizCount + 1;
    setQuizCount(newCount);
    localStorage.setItem('quizCount', newCount.toString());

    // Check for first quiz badge
    if (newCount === 1) {
      const updatedBadges = [...badges];
      const badgeIndex = updatedBadges.findIndex(b => b.id === '1');
      if (badgeIndex !== -1 && !updatedBadges[badgeIndex].earned) {
        updatedBadges[badgeIndex].earned = true;
        localStorage.setItem('badges', JSON.stringify(updatedBadges));
        setBadges(updatedBadges);
        awardBadge(updatedBadges[badgeIndex]);
      }
    }
  };

  // Function to increment session count (mock for RSVP)
  const incrementSessionCount = () => {
    const newCount = sessionCount + 1;
    setSessionCount(newCount);
    localStorage.setItem('sessionCount', newCount.toString());
  };

  // Function to increment AI usage count
  const incrementAiUsageCount = () => {
    const newCount = aiUsageCount + 1;
    setAiUsageCount(newCount);
    localStorage.setItem('aiUsageCount', newCount.toString());
  };

  // Function to increment document summarize count
  const incrementDocSummarizeCount = () => {
    const newCount = docSummarizeCount + 1;
    setDocSummarizeCount(newCount);
    localStorage.setItem('docSummarizeCount', newCount.toString());
  };

  // Function to export analytics data as CSV
  const exportAnalyticsToCSV = () => {
    if (!analyticsData || analyticsData.quizzes.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Prepare CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Quiz data
    csvContent += "Quiz Analytics\n";
    csvContent += "Date,Topic,Score (%)\n";
    analyticsData.quizzes.forEach((quiz: any) => {
      csvContent += `${quiz.date},${quiz.topic},${quiz.score}\n`;
    });
    
    csvContent += "\n";
    
    // Session data
    csvContent += "Study Sessions\n";
    csvContent += "Date,Topic,Duration (hrs),Attendees\n";
    analyticsData.sessions.forEach((session: any) => {
      csvContent += `${session.date},${session.topic},${session.duration},${session.attendees}\n`;
    });
    
    csvContent += "\n";
    
    // Summary
    csvContent += "Summary\n";
    csvContent += `Average Score,${analyticsData.avgScore}%\n`;
    csvContent += `Average Session Time,${analyticsData.avgTime} hours\n`;
    csvContent += `Total Sessions,${analyticsData.totalSessions}\n`;
    csvContent += `Insight,${analyticsData.insight}\n`;

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `studybuddy-analytics-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Analytics exported successfully! 📊', {
      icon: '✅',
      duration: 2000,
    });
  };

  // Function to log study activity and increment streak
  const logStudyActivity = () => {
    const streakData = localStorage.getItem('streak');
    const today = new Date().toDateString();
    
    if (!streakData) return;

    const streak = JSON.parse(streakData);
    const lastDate = new Date(streak.lastDate);
    const todayDate = new Date(today);
    const yesterday = new Date(todayDate);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if already logged today
    if (lastDate.toDateString() === today) {
      // Already logged today, no increment needed
      return;
    }

    let newCurrent = streak.current;
    
    // Check if last activity was yesterday
    if (lastDate.toDateString() === yesterday.toDateString()) {
      // Continue streak
      newCurrent = streak.current + 1;
    } else {
      // Start new streak
      newCurrent = 1;
    }

    const newBest = Math.max(newCurrent, streak.best);
    
    const updatedStreak = {
      current: newCurrent,
      best: newBest,
      lastDate: today,
    };

    localStorage.setItem('streak', JSON.stringify(updatedStreak));
    setCurrentStreak(newCurrent);
    setBestStreak(newBest);

    // Notify other components (like navbar) about streak update
    window.dispatchEvent(new Event('streakUpdated'));

    // Trigger animations
    setStreakAnimation(true);
    setTimeout(() => setStreakAnimation(false), 1000);

    // Confetti celebration
    const { confetti } = require('party-js');
    confetti(document.body, {
      count: 30,
      spread: 40,
    });

    // Success toast
    toast.success(`🔥 Streak increased to ${newCurrent} days!`, {
      duration: 3000,
    });

    // Special milestone toasts
    if (newCurrent === 7) {
      toast.success('🎉 Amazing! You reached a 7-day streak!', {
        duration: 4000,
      });
    } else if (newCurrent === 30) {
      toast.success('🏆 Incredible! 30-day streak achieved!', {
        duration: 4000,
      });
    } else if (newCurrent > bestStreak) {
      toast.success('🌟 New personal record!', {
        duration: 3000,
      });
    }
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;

    const userMessage = inputText.trim();
    setInputText("");
    setIsSending(true);

    // Add user message
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);

    // Show typing indicator
    setIsTyping(true);

    try {
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: userMessage }),
      });

      const data = await response.json();

      // Simulate typing delay
      setTimeout(() => {
        setIsTyping(false);

        if (response.ok && data.reply) {
          // Add AI response
          setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
          // Log study activity for streak
          logStudyActivity();
          // Increment AI usage count for badge tracking
          incrementAiUsageCount();
        } else if (response.status === 429) {
          // Rate limit error - show friendly message
          setMessages((prev) => [
            ...prev,
            { role: "ai", text: "🔄 I'm a bit busy right now! Please wait about 30 seconds and try again. The AI service has rate limits to ensure fair usage for everyone." },
          ]);
          toast.error("AI is rate limited. Please wait and try again.", { duration: 5000 });
        } else {
          // Add error message
          setMessages((prev) => [
            ...prev,
            { role: "ai", text: data.error || "Sorry, I couldn't process that. Please try again." },
          ]);
          toast.error(data.error || "Failed to get response");
        }
        setIsSending(false);
      }, 800);
    } catch (error) {
      setIsTyping(false);
      setIsSending(false);
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Sorry, something went wrong. Please check your connection and try again." },
      ]);
      toast.error("Failed to connect to AI");
    }
  };

  // Handle copy to clipboard
  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle document upload and summarization
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB', {
        icon: '⚠️',
        duration: 3000,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Check file type
    const allowedTypes = ['.pdf', '.txt', '.docx'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      toast.error('Unsupported file format. Please upload PDF, TXT, or DOCX files', {
        icon: '❌',
        duration: 3000,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setIsUploading(true);
    setSummary('');
    setSummaryFileName(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.summary) {
        setSummary(data.summary);
        toast.success('Document summarized successfully! 📄', {
          icon: '✅',
          duration: 2000,
        });
        // Log study activity for streak
        logStudyActivity();
        // Increment document summarize count for badge tracking
        incrementDocSummarizeCount();
      } else {
        throw new Error(data.error || 'Failed to summarize document');
      }
    } catch (error: any) {
      console.error('Summarize error:', error);
      const errorMessage = error?.message || 'Failed to summarize document. Please try again.';
      toast.error(errorMessage);
      setSummary('');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle copy summary
  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopiedSummary(true);
      toast.success('Summary copied to clipboard!');
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  // Handle save summary
  const handleSaveSummary = () => {
    try {
      const savedSummaries = JSON.parse(localStorage.getItem('my_summaries') || '[]');
      const newSummary = {
        id: Date.now(),
        fileName: summaryFileName,
        summary: summary,
        timestamp: new Date().toISOString(),
      };
      savedSummaries.unshift(newSummary);
      localStorage.setItem('my_summaries', JSON.stringify(savedSummaries));
      toast.success('Summary saved to My Summaries! 💾', {
        icon: '✅',
        duration: 2000,
      });
    } catch (error) {
      toast.error('Failed to save summary');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  // Mock stats data
  const stats = [
    {
      title: "Study Streak",
      value: currentStreak.toString(),
      unit: "days",
      icon: Flame,
      color: "from-orange-500 to-red-500",
      bgGradient: "from-orange-500/20 to-red-500/20",
    },
    {
      title: "Study Hours",
      value: "12.5",
      unit: "hours",
      icon: Clock,
      color: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-500/20 to-cyan-500/20",
    },
    {
      title: "Quizzes Done",
      value: "8",
      unit: "completed",
      icon: Target,
      color: "from-gray-700 to-gray-900",
      bgGradient: "from-gray-700/20 to-gray-900/20",
    },
    {
      title: "Study Buddies",
      value: "3",
      unit: "active",
      icon: Users,
      color: "from-green-500 to-emerald-500",
      bgGradient: "from-green-500/20 to-emerald-500/20",
    },
  ];

  // Chart data for study hours (Bar chart)
  const studyHoursData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Study Hours",
        data: [2, 3.5, 1.5, 4, 2.5, 3, 2],
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const studyHoursOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Weekly Study Hours",
        color: "#fff",
        font: {
          size: 16,
          weight: "bold" as const,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: "#fff" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
      x: {
        ticks: { color: "#fff" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
    },
  };

  // Chart data for quiz scores (Pie chart)
  const quizScoresData = {
    labels: ["Excellent (90-100%)", "Good (75-89%)", "Fair (60-74%)"],
    datasets: [
      {
        data: [5, 2, 1],
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(251, 146, 60, 0.8)",
        ],
        borderColor: [
          "rgba(34, 197, 94, 1)",
          "rgba(59, 130, 246, 1)",
          "rgba(251, 146, 60, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const quizScoresOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "#fff",
          padding: 15,
        },
      },
      title: {
        display: true,
        text: "Quiz Performance",
        color: "#fff",
        font: {
          size: 16,
          weight: "bold" as const,
        },
      },
    },
  };

  return (
    <AnimatedPage>
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Header with Animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-4xl md:text-6xl font-bold text-white mb-4"
            >
              Welcome back, <span className="gradient-text">{user?.name}</span>! 👋
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-gray-300"
            >
              Here&apos;s your learning progress today
            </motion.p>
          </motion.div>

          {/* Warning Banner */}
          {hasWarning && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl p-6 border-2 border-red-500/50 shadow-xl">
                <div className="flex items-start gap-4">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="p-3 bg-red-500/30 rounded-xl"
                  >
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      ⚠️ Community Guidelines Warning
                    </h3>
                    <p className="text-gray-300 mb-3">
                      Your account has received a warning for violating community guidelines. 
                      Please review our policies and ensure future interactions follow our standards.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          toast('Please review community guidelines and maintain respectful behavior.', {
                            icon: '📋',
                            duration: 5000,
                          });
                        }}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all duration-300 text-sm"
                      >
                        View Guidelines
                      </button>
                      <button
                        onClick={() => {
                          setHasWarning(false);
                          toast.success('Warning acknowledged');
                        }}
                        className="px-4 py-2 bg-red-500/30 hover:bg-red-500/40 text-white font-semibold rounded-lg transition-all duration-300 text-sm"
                      >
                        I Understand
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative group"
              >
                {/* Gradient Border Effect */}
                <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} rounded-2xl opacity-75 group-hover:opacity-100 transition-opacity blur-sm`}></div>
                
                <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20">
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} rounded-2xl opacity-50`}></div>
                  
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    
                    {/* Stats */}
                    <h3 className="text-gray-300 text-sm font-medium mb-2">
                      {stat.title}
                    </h3>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-4xl font-bold text-white">
                        {stat.value}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {stat.unit}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Enhanced Streak Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-12"
          >
            <div className="relative group">
              {/* Animated glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 rounded-3xl opacity-75 blur-xl group-hover:opacity-100 transition-opacity"></div>
              
              <div className="relative bg-gradient-to-br from-gray-700/20 via-gray-800/20 to-gray-900/20 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-600/30">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  {/* Left Section - Current Streak */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                      <motion.div
                        animate={
                          currentStreak > 5 || streakAnimation
                            ? {
                                scale: [1, 1.2, 1],
                                rotate: [0, 10, -10, 0],
                              }
                            : {}
                        }
                        transition={{
                          duration: 0.5,
                          repeat: currentStreak > 5 ? Infinity : 0,
                          repeatDelay: 1,
                        }}
                      >
                        <Flame className="w-10 h-10 text-orange-400" />
                      </motion.div>
                      <h2 className="text-3xl font-bold text-white">Daily Study Streak</h2>
                    </div>
                    
                    <motion.div
                      key={currentStreak}
                      initial={{ rotateX: 90, opacity: 0 }}
                      animate={{ rotateX: 0, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="mb-4"
                    >
                      <div className="flex items-baseline justify-center md:justify-start gap-2">
                        <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600">
                          {currentStreak}
                        </span>
                        <span className="text-3xl text-gray-300 font-semibold">
                          {currentStreak === 1 ? 'day' : 'days'} 🔥
                        </span>
                      </div>
                    </motion.div>

                    <p className="text-gray-300 text-lg mb-6">
                      {currentStreak === 0 
                        ? "Start your streak today by studying!" 
                        : currentStreak < 7
                        ? "Keep it up! You're building a great habit!"
                        : currentStreak < 30
                        ? "Amazing dedication! You're on fire! 🔥"
                        : "Legendary streak! You're a study champion! 🏆"
                      }
                    </p>

                    {/* Best Streak Badge */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20"
                    >
                      <Award className="w-5 h-5 text-yellow-400" />
                      <span className="text-white font-semibold">
                        Best Streak: {bestStreak} {bestStreak === 1 ? 'day' : 'days'}
                      </span>
                    </motion.div>
                  </div>

                  {/* Right Section - Action Button */}
                  <div className="flex flex-col items-center gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={logStudyActivity}
                      className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                    >
                      <Flame className="w-6 h-6" />
                      Log Study Activity
                    </motion.button>
                    
                    <p className="text-sm text-gray-400 text-center max-w-xs">
                      Click to manually log activity, or it will auto-track when you use AI features
                    </p>
                  </div>
                </div>

                {/* Progress indicators for milestones */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                    <span>Next milestone</span>
                    <span className="font-semibold text-white">
                      {currentStreak < 7 ? '7 days' : currentStreak < 30 ? '30 days' : currentStreak < 100 ? '100 days' : 'Legend! 🏆'}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ 
                        width: currentStreak < 7 
                          ? `${(currentStreak / 7) * 100}%`
                          : currentStreak < 30
                          ? `${(currentStreak / 30) * 100}%`
                          : currentStreak < 100
                          ? `${(currentStreak / 100) * 100}%`
                          : '100%'
                      }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Badges Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mb-12"
          >
            <div className="relative group">
              {/* Animated glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 rounded-3xl opacity-60 blur-xl group-hover:opacity-80 transition-opacity"></div>
              
              <div className="relative bg-gradient-to-br from-yellow-500/20 via-amber-500/20 to-orange-500/20 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-yellow-400/30">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
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
                    >
                      <Trophy className="w-8 h-8 text-yellow-400" />
                    </motion.div>
                    <h2 className="text-3xl font-bold text-white">Achievement Badges</h2>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-4">
                    <div className="text-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                      <p className="text-2xl font-bold text-white">
                        {badges.filter(b => b.earned).length}/{badges.length}
                      </p>
                      <p className="text-xs text-gray-300">Earned</p>
                    </div>
                  </div>
                </div>

                {/* Badges Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
                  {badges.map((badge, index) => {
                    const iconMap: Record<string, any> = {
                      Brain,
                      Bot,
                      Flame,
                      Award,
                      Users,
                      Target,
                      FileText,
                      Sparkles,
                    };
                    const IconComponent = iconMap[badge.icon] || Star;

                    const isEarning = earnedBadgeId === badge.id;

                    return (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative"
                      >
                        {/* Tooltip on hover */}
                        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                          <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-xl border border-white/20">
                            <p className="font-semibold">{badge.name}</p>
                            <p className="text-xs text-gray-300">{badge.desc}</p>
                          </div>
                          <div className="w-3 h-3 bg-gray-900 transform rotate-45 mx-auto -mt-1.5 border-r border-b border-white/20"></div>
                        </div>

                        {/* Badge Card */}
                        <motion.div
                          whileHover={{ scale: 1.05, y: -5 }}
                          animate={isEarning ? {
                            rotateY: [0, 180, 360],
                            scale: [1, 1.2, 1],
                          } : {}}
                          transition={isEarning ? { duration: 1 } : {}}
                          className={`
                            relative p-6 rounded-2xl border-2 transition-all duration-300
                            ${badge.earned 
                              ? `bg-gradient-to-br ${badge.color} border-white/30 shadow-lg` 
                              : 'bg-white/5 border-white/10 grayscale opacity-50'
                            }
                          `}
                          style={{ transformStyle: 'preserve-3d' }}
                        >
                          {/* Shiny effect on earn */}
                          {isEarning && (
                            <motion.div
                              initial={{ left: '-100%' }}
                              animate={{ left: '200%' }}
                              transition={{ duration: 0.8 }}
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                              style={{ pointerEvents: 'none' }}
                            />
                          )}

                          {/* Icon */}
                          <div className="flex flex-col items-center">
                            <div className={`
                              w-16 h-16 rounded-full flex items-center justify-center mb-3
                              ${badge.earned 
                                ? 'bg-white/20 backdrop-blur-sm' 
                                : 'bg-white/5'
                              }
                            `}>
                              <IconComponent className={`
                                w-8 h-8
                                ${badge.earned ? 'text-white' : 'text-gray-500'}
                              `} />
                            </div>
                            
                            {/* Badge Name */}
                            <h3 className={`
                              text-sm font-bold text-center
                              ${badge.earned ? 'text-white' : 'text-gray-500'}
                            `}>
                              {badge.name}
                            </h3>

                            {/* Earned indicator */}
                            {badge.earned && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="mt-2"
                              >
                                <Check className="w-5 h-5 text-green-400" />
                              </motion.div>
                            )}
                          </div>

                          {/* Lock overlay for unearned */}
                          {!badge.earned && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl backdrop-blur-sm">
                              <div className="text-4xl">🔒</div>
                            </div>
                          )}
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Progress Info */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
                    <div className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                      <p className="text-2xl font-bold text-white">{quizCount}</p>
                      <p className="text-xs text-gray-300">Quizzes</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                      <p className="text-2xl font-bold text-white">{sessionCount}</p>
                      <p className="text-xs text-gray-300">Sessions</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                      <p className="text-2xl font-bold text-white">{aiUsageCount}</p>
                      <p className="text-xs text-gray-300">AI Chats</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                      <p className="text-2xl font-bold text-white">{docSummarizeCount}</p>
                      <p className="text-xs text-gray-300">Summaries</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                      <p className="text-2xl font-bold text-white">{currentStreak}</p>
                      <p className="text-xs text-gray-300">Day Streak</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                      <p className="text-2xl font-bold text-white">#{Math.floor(Math.random() * 100) + 1}</p>
                      <p className="text-xs text-gray-300">Rank</p>
                    </div>
                  </div>
                </div>

                {/* Leaderboard Tease */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 text-center"
                >
                  <Link
                    href="/leaderboard"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Trophy className="w-5 h-5" />
                    View Full Leaderboard
                    <TrendingUp className="w-4 h-4" />
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Performance Analytics Section */}
          <motion.div
            id="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mb-12"
          >
            <div className="relative group">
              {/* Animated glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 rounded-3xl opacity-60 blur-xl group-hover:opacity-80 transition-opacity"></div>
              
              <div className="relative bg-gradient-to-br from-gray-700/20 via-gray-800/20 to-gray-900/20 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-600/30">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{
                        y: [0, -5, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <BarChart3 className="w-8 h-8 text-blue-400" />
                    </motion.div>
                    <h2 className="text-3xl font-bold text-white">Performance Analytics</h2>
                  </div>
                  
                  {/* Export Button */}
                  {analyticsData && analyticsData.quizzes.length > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={exportAnalyticsToCSV}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </motion.button>
                  )}
                </div>

                {isLoadingAnalytics ? (
                  <div className="flex items-center justify-center py-20">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-12 h-12 text-blue-400" />
                    </motion.div>
                  </div>
                ) : analyticsData && analyticsData.quizzes.length > 0 ? (
                  <>
                    {/* Insights Card */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      className="mb-6 p-6 bg-gradient-to-r from-gray-700/30 to-gray-800/30 rounded-2xl border border-gray-600/30"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/10 rounded-xl">
                          <Sparkles className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2">Performance Insights</h3>
                          <p className="text-gray-300 text-lg mb-4">{analyticsData.insight}</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-5 h-5 text-green-400" />
                              <div>
                                <p className="text-sm text-gray-400">Average Score</p>
                                <p className="text-2xl font-bold text-white">{analyticsData.avgScore}%</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-5 h-5 text-blue-400" />
                              <div>
                                <p className="text-sm text-gray-400">Avg Session Time</p>
                                <p className="text-2xl font-bold text-white">{analyticsData.avgTime} hrs</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-5 h-5 text-purple-400" />
                              <div>
                                <p className="text-sm text-gray-400">Total Sessions</p>
                                <p className="text-2xl font-bold text-white">{analyticsData.totalSessions}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Quiz Performance Chart */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
                      >
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-green-400" />
                          Quiz Score Trends
                        </h3>
                        <div className="h-64">
                          <ChartWrapper
                            type="line"
                            data={{
                              labels: analyticsData.quizzes.map((q: any) => q.date),
                              datasets: [
                                {
                                  label: 'Score (%)',
                                  data: analyticsData.quizzes.map((q: any) => q.score),
                                  borderColor: 'rgba(59, 130, 246, 1)',
                                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                  tension: 0.4,
                                  fill: true,
                                  pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                                  pointBorderColor: '#fff',
                                  pointBorderWidth: 2,
                                  pointRadius: 5,
                                  pointHoverRadius: 7,
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  display: false,
                                },
                                tooltip: {
                                  callbacks: {
                                    afterLabel: function(context: any) {
                                      const index = context.dataIndex;
                                      return `Topic: ${analyticsData.quizzes[index].topic}`;
                                    }
                                  }
                                }
                              },
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  max: 100,
                                  ticks: { color: '#fff' },
                                  grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                },
                                x: {
                                  ticks: { 
                                    color: '#fff',
                                    maxRotation: 45,
                                    minRotation: 45,
                                  },
                                  grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                },
                              },
                            }}
                          />
                        </div>
                      </motion.div>

                      {/* Recent Sessions Table */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
                      >
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-purple-400" />
                          Recent Study Sessions
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-white/10">
                                <th className="text-left text-sm text-gray-400 pb-3 font-semibold">Date</th>
                                <th className="text-left text-sm text-gray-400 pb-3 font-semibold">Topic</th>
                                <th className="text-center text-sm text-gray-400 pb-3 font-semibold">Duration</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analyticsData.sessions.slice(0, 5).map((session: any, index: number) => (
                                <motion.tr
                                  key={index}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                >
                                  <td className="py-3 text-sm text-gray-300">{session.date}</td>
                                  <td className="py-3 text-sm text-white">{session.topic}</td>
                                  <td className="py-3 text-sm text-gray-300 text-center">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 rounded-lg">
                                      <Clock className="w-3 h-3" />
                                      {session.duration} hrs
                                    </span>
                                  </td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    </div>

                    {/* Quiz History Table */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mt-6 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
                    >
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-pink-400" />
                        Recent Quiz Results
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="text-left text-sm text-gray-400 pb-3 font-semibold">Date</th>
                              <th className="text-left text-sm text-gray-400 pb-3 font-semibold">Topic</th>
                              <th className="text-center text-sm text-gray-400 pb-3 font-semibold">Score</th>
                              <th className="text-center text-sm text-gray-400 pb-3 font-semibold">Performance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analyticsData.quizzes.map((quiz: any, index: number) => (
                              <motion.tr
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="border-b border-white/5 hover:bg-white/5 transition-colors"
                              >
                                <td className="py-3 text-sm text-gray-300">{quiz.date}</td>
                                <td className="py-3 text-sm text-white">{quiz.topic}</td>
                                <td className="py-3 text-center">
                                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg font-bold ${
                                    quiz.score >= 90 
                                      ? 'bg-green-500/20 text-green-400'
                                      : quiz.score >= 75
                                      ? 'bg-blue-500/20 text-blue-400'
                                      : quiz.score >= 60
                                      ? 'bg-yellow-500/20 text-yellow-400'
                                      : 'bg-red-500/20 text-red-400'
                                  }`}>
                                    {quiz.score}%
                                  </span>
                                </td>
                                <td className="py-3 text-center">
                                  {quiz.score >= 90 ? (
                                    <span className="text-green-400 flex items-center justify-center gap-1">
                                      <TrendingUp className="w-4 h-4" />
                                      Excellent
                                    </span>
                                  ) : quiz.score >= 75 ? (
                                    <span className="text-blue-400 flex items-center justify-center gap-1">
                                      <TrendingUp className="w-4 h-4" />
                                      Good
                                    </span>
                                  ) : quiz.score >= 60 ? (
                                    <span className="text-yellow-400 flex items-center justify-center gap-1">
                                      <Target className="w-4 h-4" />
                                      Fair
                                    </span>
                                  ) : (
                                    <span className="text-red-400 flex items-center justify-center gap-1">
                                      <TrendingDown className="w-4 h-4" />
                                      Needs Work
                                    </span>
                                  )}
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center justify-center py-20"
                  >
                    <div className="p-6 bg-white/5 rounded-full mb-6">
                      <BarChart3 className="w-16 h-16 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">No Analytics Data Yet</h3>
                    <p className="text-gray-400 text-center max-w-md mb-6">
                      Complete a quiz to see your performance analytics and track your progress over time!
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsQuizModalOpen(true)}
                      className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300"
                    >
                      Take Your First Quiz
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {/* Bar Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20"
            >
              <div className="h-80">
                <ChartWrapper type="bar" data={studyHoursData} options={studyHoursOptions} />
              </div>
            </motion.div>

            {/* Pie Chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20"
            >
              <div className="h-80">
                <ChartWrapper type="pie" data={quizScoresData} options={quizScoresOptions} />
              </div>
            </motion.div>
          </div>

          {/* Quick Actions Section */}
          <motion.div
            id="flashcards"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/20 mb-12"
          >
            <div className="flex items-center mb-6">
              <TrendingUp className="w-6 h-6 text-blue-400 mr-3" />
              <h2 className="text-2xl font-bold text-white">Quick Actions</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* AI Tools - Link to separate pages */}
              <Link href="/ai-tutor">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
                >
                  <Bot className="w-5 h-5" />
                  <span>AI Tutor</span>
                </motion.div>
              </Link>
              
              <Link href="/summarizer">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
                >
                  <FileText className="w-5 h-5" />
                  <span>Summarizer</span>
                </motion.div>
              </Link>
              
              <Link href="/study-plan">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
                >
                  <Lightbulb className="w-5 h-5" />
                  <span>Study Plan</span>
                </motion.div>
              </Link>

              <Link href="/flashcards">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Flashcards</span>
                </motion.div>
              </Link>
              
              <Link href="/quiz">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
                >
                  <Brain className="w-5 h-5" />
                  <span>Quiz Generator</span>
                </motion.div>
              </Link>

              <Link href="/exam">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-teal-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
                >
                  <GraduationCap className="w-5 h-5" />
                  <span>AI Exam</span>
                </motion.div>
              </Link>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/search')}
                className="flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <Users className="w-5 h-5" />
                <span>Find Buddies</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/groups')}
                className="flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <Users className="w-5 h-5" />
                <span>My Groups</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/groups/create')}
                className="flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <Users className="w-5 h-5" />
                <span>Create Group</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/courses')}
                className="flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <BookOpen className="w-5 h-5" />
                <span>Browse Courses</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/admin/courses/create')}
                className="flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <Upload className="w-5 h-5" />
                <span>Create Course</span>
              </motion.button>

              {/* Test button for session RSVP */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  incrementSessionCount();
                  toast.success('Session attended! 📚', {
                    icon: '✅',
                    duration: 2000,
                  });
                }}
                className="flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <Clock className="w-5 h-5" />
                <span>Mock Session RSVP</span>
              </motion.button>
            </div>
          </motion.div>

          {/* AI Tutor Chat Section */}
          <motion.div
            id="ai-tutor"
            ref={chatContainerRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-gray-700/20 to-gray-800/20 p-6 border-b border-white/20">
              <div className="flex items-center">
                <Bot className="w-8 h-8 text-blue-400 mr-3" />
                <div>
                  <h2 className="text-2xl font-bold text-white">AI Tutor</h2>
                  <p className="text-gray-300 text-sm">Ask me anything about your studies!</p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="h-96 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full text-gray-400 text-center">
                  <div>
                    <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Start a conversation with your AI tutor</p>
                    <p className="text-sm mt-2">Ask questions about any subject!</p>
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                        : "bg-white/20 text-white backdrop-blur-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                      {message.role === "ai" && (
                        <button
                          onClick={() => handleCopy(message.text, index)}
                          className="flex-shrink-0 p-1 hover:bg-white/20 rounded transition-colors"
                          title="Copy to clipboard"
                        >
                          {copiedIndex === index ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/20 bg-white/5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask your question..."
                  disabled={isSending}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isSending}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  <span className="hidden sm:inline">Send</span>
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* AI Study Plan Generator Section */}
          <motion.div
            id="study-plan"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="mt-8 mb-8"
          >
            <StudyPlanGenerator />
          </motion.div>

          {/* Document Summarizer Section */}
          <motion.div
            id="summarizer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-gray-600/20 to-gray-700/20 p-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="w-8 h-8 text-purple-400 mr-3" />
                  <div>
                    <h2 className="text-2xl font-bold text-white">Document Summarizer</h2>
                    <p className="text-gray-300 text-sm">Upload documents to get AI-powered summaries</p>
                  </div>
                </div>
                {summary && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSummary('');
                      setSummaryFileName('');
                    }}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 rounded-lg transition-all"
                    title="Clear summary"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
            </div>

            <div className="p-6">
              {!summary ? (
                <div className="text-center py-8">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.docx"
                    onChange={handleDocumentUpload}
                    className="hidden"
                  />
                  
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mb-4"
                  >
                    <FileText className="w-16 h-16 text-purple-400 mx-auto opacity-50" />
                  </motion.div>
                  
                  <h3 className="text-white font-semibold text-lg mb-2">Upload & Summarize</h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Upload PDF, TXT, or DOCX files (max 2MB) to get instant AI summaries
                  </p>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span>Upload & Summarize</span>
                      </>
                    )}
                  </motion.button>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4"
                >
                  {/* File name header */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/20">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-400" />
                      <span className="text-white font-medium">{summaryFileName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCopySummary}
                        className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-300 rounded-lg transition-all flex items-center gap-2"
                      >
                        {copiedSummary ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span className="text-sm">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span className="text-sm">Copy</span>
                          </>
                        )}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSaveSummary}
                        className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 text-green-300 rounded-lg transition-all flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        <span className="text-sm">Save</span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Summary content with markdown */}
                  <div className="bg-white/5 rounded-xl p-6 max-h-96 overflow-y-auto prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => <h1 className="text-2xl font-bold text-white mb-4">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xl font-bold text-white mb-3 mt-6">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-lg font-semibold text-white mb-2 mt-4">{children}</h3>,
                        p: ({ children }) => <p className="text-gray-300 mb-3 leading-relaxed">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 mb-3 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 mb-3 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="text-gray-300">{children}</li>,
                        strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="text-purple-300">{children}</em>,
                        code: ({ children }) => <code className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-sm">{children}</code>,
                      }}
                    >
                      {summary}
                    </ReactMarkdown>
                  </div>

                  {/* Upload another button */}
                  <div className="text-center pt-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all flex items-center gap-2 mx-auto"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Another Document</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Modals */}
      <FlashcardModal isOpen={isFlashcardModalOpen} onClose={() => setIsFlashcardModalOpen(false)} />
      <QuizModal 
        isOpen={isQuizModalOpen} 
        onClose={() => setIsQuizModalOpen(false)}
        onComplete={incrementQuizCount}
      />
    </AnimatedPage>
  );
}
