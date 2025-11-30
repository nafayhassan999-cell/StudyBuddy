"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AnimatedPage from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import { Calendar, ArrowLeft, Lightbulb, Clock, Target, BookOpen, Loader2, Copy, Check, Download, Save } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface SavedPlan {
  id: number;
  subject: string;
  duration: string;
  plan: string;
  timestamp: string;
}

export default function StudyPlanPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState("1 week");
  const [goal, setGoal] = useState("");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [studyPlan, setStudyPlan] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [showSavedPlans, setShowSavedPlans] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  // Load saved plans
  useEffect(() => {
    const saved = localStorage.getItem('my_study_plans');
    if (saved) {
      setSavedPlans(JSON.parse(saved));
    }
  }, []);

  const handleGeneratePlan = async () => {
    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    setIsGenerating(true);
    setStudyPlan("");

    try {
      const response = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          duration,
          goal: goal.trim(),
          difficulty,
        }),
      });

      const data = await response.json();

      if (response.ok && data.plan) {
        setStudyPlan(data.plan);
        toast.success("Study plan generated!");
      } else {
        throw new Error(data.error || "Failed to generate study plan");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to generate study plan");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(studyPlan);
      setCopied(true);
      toast.success("Plan copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const handleSavePlan = () => {
    const newPlan: SavedPlan = {
      id: Date.now(),
      subject,
      duration,
      plan: studyPlan,
      timestamp: new Date().toISOString(),
    };
    const updated = [newPlan, ...savedPlans];
    localStorage.setItem('my_study_plans', JSON.stringify(updated));
    setSavedPlans(updated);
    toast.success("Study plan saved!");
  };

  const handleDownloadPlan = () => {
    const blob = new Blob([studyPlan], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-plan-${subject.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Plan downloaded!");
  };

  const handleDeletePlan = (id: number) => {
    const updated = savedPlans.filter(p => p.id !== id);
    localStorage.setItem('my_study_plans', JSON.stringify(updated));
    setSavedPlans(updated);
    toast.success("Plan deleted");
  };

  if (!isAuthenticated) {
    return null;
  }

  const durationOptions = [
    "1 week",
    "2 weeks",
    "1 month",
    "2 months",
    "3 months",
    "6 months",
  ];

  const difficultyOptions = [
    { value: "beginner", label: "Beginner", color: "from-green-500 to-emerald-500" },
    { value: "intermediate", label: "Intermediate", color: "from-yellow-500 to-orange-500" },
    { value: "advanced", label: "Advanced", color: "from-red-500 to-pink-500" },
  ];

  const subjectSuggestions = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Computer Science",
    "History",
    "English Literature",
    "Spanish",
    "Economics",
  ];

  return (
    <AnimatedPage>
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link 
              href="/dashboard"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl">
                  <Calendar className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white">AI Study Plan Generator</h1>
                  <p className="text-gray-400">Create personalized study plans with AI</p>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSavedPlans(!showSavedPlans)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              >
                <Save className="w-4 h-4" />
                Saved ({savedPlans.length})
              </motion.button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8"
            >
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-orange-400" />
                Plan Details
              </h2>

              <div className="space-y-6">
                {/* Subject Input */}
                <div>
                  <label className="block text-gray-300 font-medium mb-2">
                    <BookOpen className="w-4 h-4 inline mr-2" />
                    Subject / Topic
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Calculus, World History, Python Programming"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  />
                  {/* Subject Suggestions */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {subjectSuggestions.slice(0, 5).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSubject(s)}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm rounded-lg transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration Selection */}
                <div>
                  <label className="block text-gray-300 font-medium mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Study Duration
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {durationOptions.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          duration === d
                            ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                            : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty Selection */}
                <div>
                  <label className="block text-gray-300 font-medium mb-2">
                    <Target className="w-4 h-4 inline mr-2" />
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {difficultyOptions.map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setDifficulty(d.value)}
                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          difficulty === d.value
                            ? `bg-gradient-to-r ${d.color} text-white`
                            : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Goal Input */}
                <div>
                  <label className="block text-gray-300 font-medium mb-2">
                    Learning Goal (Optional)
                  </label>
                  <textarea
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g., Prepare for final exam, Learn basics for a project, Get certified..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none"
                  />
                </div>

                {/* Generate Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGeneratePlan}
                  disabled={isGenerating || !subject.trim()}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating Plan...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="w-5 h-5" />
                      Generate Study Plan
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>

            {/* Plan Output Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-red-400" />
                  Your Study Plan
                </h2>
                
                {studyPlan && (
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCopy}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      title="Copy plan"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSavePlan}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      title="Save plan"
                    >
                      <Save className="w-4 h-4 text-gray-400" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDownloadPlan}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      title="Download plan"
                    >
                      <Download className="w-4 h-4 text-gray-400" />
                    </motion.button>
                  </div>
                )}
              </div>

              <div className="min-h-[400px] max-h-[600px] overflow-y-auto">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center h-[400px]">
                    <Loader2 className="w-12 h-12 text-orange-400 animate-spin mb-4" />
                    <p className="text-white font-medium">Creating your personalized study plan...</p>
                    <p className="text-gray-400 text-sm mt-2">This may take a moment</p>
                  </div>
                ) : studyPlan ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{studyPlan}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center">
                    <Calendar className="w-16 h-16 text-gray-600 mb-4" />
                    <p className="text-gray-400 max-w-sm">
                      Fill in the details and click &quot;Generate Study Plan&quot; to create your personalized learning roadmap
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Saved Plans Modal */}
          {showSavedPlans && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowSavedPlans(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900 rounded-2xl border border-white/20 p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Saved Study Plans</h2>
                  <button
                    onClick={() => setShowSavedPlans(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {savedPlans.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No saved study plans yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedPlans.map((plan) => (
                      <div
                        key={plan.id}
                        className="bg-white/5 rounded-xl p-4 border border-white/10"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="text-white font-medium">{plan.subject}</h3>
                            <p className="text-gray-400 text-sm">{plan.duration}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSubject(plan.subject);
                                setStudyPlan(plan.plan);
                                setShowSavedPlans(false);
                              }}
                              className="text-sm text-blue-400 hover:text-blue-300"
                            >
                              Load
                            </button>
                            <button
                              onClick={() => handleDeletePlan(plan.id)}
                              className="text-sm text-red-400 hover:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-400 text-sm line-clamp-2">{plan.plan}</p>
                        <p className="text-gray-500 text-xs mt-2">
                          {new Date(plan.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </div>
      </main>
    </AnimatedPage>
  );
}
