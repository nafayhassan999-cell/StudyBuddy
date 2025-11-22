"use client";

import { useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Sparkles, Calendar, Target, Clock, CheckCircle2, Circle, Download, RefreshCw, Loader2, X, Maximize2 } from "lucide-react";
import { useRef } from "react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";

interface StudyTask {
  day: number;
  title: string;
  tasks: string[];
  duration: string;
  type?: string;
}

interface StudyPlanMetadata {
  topic: string;
  days: number;
  goal: string;
  hours: number;
  generatedAt: string;
}

const goalOptions = [
  "Ace Exam",
  "Understand Concepts",
  "Complete Project",
  "Career Switch",
  "Hobby Learning",
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

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
  },
};

export default function StudyPlanGenerator() {
  const [topic, setTopic] = useState("");
  const [days, setDays] = useState(7);
  const [goal, setGoal] = useState("Understand Concepts");
  const [hours, setHours] = useState(2);
  const [isGenerating, setIsGenerating] = useState(false);
  const [studyPlan, setStudyPlan] = useState<StudyTask[]>([]);
  const [metadata, setMetadata] = useState<StudyPlanMetadata | null>(null);
  const [progress, setProgress] = useState<{ [key: string]: boolean }>({});
  const [showPlanModal, setShowPlanModal] = useState(false);

  const planRef = useRef(null);
  const isInView = useInView(planRef, { once: true, margin: "-100px" });

  // Load progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem("studyPlanProgress");
    if (savedProgress) {
      try {
        setProgress(JSON.parse(savedProgress));
      } catch (error) {
        console.error("Failed to load progress:", error);
      }
    }

    // Load last plan
    const savedPlan = localStorage.getItem("studyPlan");
    const savedMetadata = localStorage.getItem("studyPlanMetadata");
    if (savedPlan && savedMetadata) {
      try {
        setStudyPlan(JSON.parse(savedPlan));
        setMetadata(JSON.parse(savedMetadata));
      } catch (error) {
        console.error("Failed to load saved plan:", error);
      }
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    if (Object.keys(progress).length > 0) {
      localStorage.setItem("studyPlanProgress", JSON.stringify(progress));
    }
  }, [progress]);

  const handleGeneratePlan = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic to study");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/ai/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          days,
          goal,
          hours,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // More informative error message
        const errorMessage = data.error || "Failed to generate plan";
        if (errorMessage.includes("API key not configured")) {
          throw new Error("⚠️ Gemini API not configured. Please restart your dev server (Ctrl+C and run 'npm run dev' again)");
        }
        throw new Error(errorMessage);
      }

      setStudyPlan(data.plan);
      setMetadata(data.metadata);
      setProgress({}); // Reset progress for new plan

      // Save to localStorage
      localStorage.setItem("studyPlan", JSON.stringify(data.plan));
      localStorage.setItem("studyPlanMetadata", JSON.stringify(data.metadata));
      localStorage.removeItem("studyPlanProgress");

      setShowPlanModal(true); // Show modal with the plan
      toast.success("Study plan generated successfully! 🎉");
    } catch (error: any) {
      console.error("Error generating plan:", error);
      toast.error(error.message || "AI busy, try again");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTask = (dayIndex: number, taskIndex: number) => {
    const key = `${dayIndex}-${taskIndex}`;
    setProgress((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const calculateDayProgress = (dayIndex: number, tasksCount: number) => {
    let completed = 0;
    for (let i = 0; i < tasksCount; i++) {
      if (progress[`${dayIndex}-${i}`]) completed++;
    }
    return tasksCount > 0 ? Math.round((completed / tasksCount) * 100) : 0;
  };

  const calculateTotalProgress = () => {
    if (studyPlan.length === 0) return 0;
    let totalTasks = 0;
    let completedTasks = 0;

    studyPlan.forEach((day, dayIndex) => {
      totalTasks += day.tasks.length;
      day.tasks.forEach((_, taskIndex) => {
        if (progress[`${dayIndex}-${taskIndex}`]) completedTasks++;
      });
    });

    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  const exportToPDF = () => {
    if (studyPlan.length === 0) {
      toast.error("No study plan to export");
      return;
    }

    try {
      const doc = new jsPDF();
      let yPosition = 20;

      // Title
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Study Plan", 20, yPosition);
      yPosition += 10;

      // Metadata
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      if (metadata) {
        doc.text(`Topic: ${metadata.topic}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Goal: ${metadata.goal}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Duration: ${metadata.days} days | ${metadata.hours} hours/day`, 20, yPosition);
        yPosition += 10;
      }

      // Plan details
      studyPlan.forEach((day, index) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }

        // Day title
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(day.title, 20, yPosition);
        yPosition += 7;

        // Duration
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text(`Duration: ${day.duration}`, 20, yPosition);
        yPosition += 7;

        // Tasks
        doc.setFont("helvetica", "normal");
        day.tasks.forEach((task, taskIndex) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          const isCompleted = progress[`${index}-${taskIndex}`];
          const checkbox = isCompleted ? "[✓]" : "[ ]";
          doc.text(`  ${checkbox} ${task}`, 25, yPosition);
          yPosition += 6;
        });

        yPosition += 5;
      });

      doc.save(`study-plan-${metadata?.topic || "plan"}.pdf`);
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    }
  };

  const handleRegenerate = () => {
    setStudyPlan([]);
    setProgress({});
    localStorage.removeItem("studyPlan");
    localStorage.removeItem("studyPlanMetadata");
    localStorage.removeItem("studyPlanProgress");
    toast.success("Ready to generate a new plan!");
  };

  return (
    <div>
      {/* Form Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/20 dark:bg-black/30 white:bg-white/50 ocean:bg-ocean-card/30 forest:bg-forest-card/30 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/30 dark:border-gray-700/30 white:border-gray-300 ocean:border-ocean-border/30 forest:border-forest-border/30"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-gray-600/20 to-gray-700/20 rounded-xl">
            <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white white:text-gray-900">
              AI Study Plan Generator
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 white:text-gray-700">
              Create a personalized study roadmap with AI
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Topic Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 white:text-gray-900 mb-2">
              I want to study
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Machine Learning, Spanish, React.js"
              className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/90 white:bg-white border border-gray-300 dark:border-gray-600 white:border-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white white:text-gray-900 placeholder-gray-600 dark:placeholder-gray-400"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Days Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 white:text-gray-900 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                I have (days)
              </label>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(Math.max(1, Math.min(90, parseInt(e.target.value) || 7)))}
                min="1"
                max="90"
                className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/90 white:bg-white border border-gray-300 dark:border-gray-600 white:border-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white white:text-gray-900"
              />
            </div>

            {/* Goal Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 white:text-gray-900 mb-2">
                <Target className="w-4 h-4 inline mr-1" />
                Goal
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/90 white:bg-white border border-gray-300 dark:border-gray-600 white:border-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white white:text-gray-900 cursor-pointer appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  paddingRight: '2.5rem'
                }}
              >
                {goalOptions.map((option) => (
                  <option 
                    key={option} 
                    value={option}
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white py-2"
                  >
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Hours Slider */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 white:text-gray-900 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Daily Hours: {hours}h
            </label>
            <input
              type="range"
              min="1"
              max="8"
              value={hours}
              onChange={(e) => setHours(parseInt(e.target.value))}
              className="w-full h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800/30 dark:to-gray-900/30 rounded-lg appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
                [&::-webkit-slider-thumb]:from-gray-600 [&::-webkit-slider-thumb]:to-gray-700
                [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full 
                [&::-moz-range-thumb]:bg-gradient-to-r [&::-moz-range-thumb]:from-gray-600 
                [&::-moz-range-thumb]:to-gray-700 [&::-moz-range-thumb]:border-0 
                [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-lg"
            />
            <div className="flex justify-between mt-1 text-xs text-gray-600 dark:text-gray-400 white:text-gray-600">
              <span>1h</span>
              <span>4h</span>
              <span>8h</span>
            </div>
          </div>

          {/* Generate Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="w-full py-4 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white font-bold rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Your Plan...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate My Plan
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Study Plan Display - Compact Summary Only */}
      {studyPlan.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-white/20 dark:bg-black/30 white:bg-white/50 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-white/30 dark:border-gray-700/30"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {calculateTotalProgress()}%
                </div>
                <div className="text-xs text-gray-800 dark:text-gray-300 white:text-gray-700">Complete</div>
              </div>
              <div className="h-12 w-px bg-gray-300 dark:bg-gray-600"></div>
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white white:text-gray-900">
                  {metadata?.topic}
                </div>
                <div className="text-xs text-gray-700 dark:text-gray-300 white:text-gray-600">
                  {metadata?.days} days • {metadata?.hours}h/day
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPlanModal(true)}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg flex items-center gap-2 shadow-md transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
                View Full Plan
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportToPDF}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg flex items-center gap-2 shadow-md transition-colors"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRegenerate}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg flex items-center gap-2 shadow-md transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty State - Only show when no plan exists */}
      {studyPlan.length === 0 && !isGenerating && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-8 bg-white/10 dark:bg-black/20 white:bg-white/30 backdrop-blur-xl rounded-2xl p-12 text-center border border-dashed border-gray-300 dark:border-gray-600"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className="inline-block mb-4"
          >
            <Sparkles className="w-16 h-16 text-purple-400" />
          </motion.div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white white:text-gray-900 mb-2">
            Create your first study plan
          </h3>
          <p className="text-gray-600 dark:text-gray-400 white:text-gray-700">
            Fill in the form above and let AI create a personalized roadmap for you
          </p>
        </motion.div>
      )}

      {/* Full Plan Modal */}
      <AnimatePresence>
        {showPlanModal && studyPlan.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPlanModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Sparkles className="w-8 h-8" />
                    <div>
                      <h2 className="text-2xl font-bold">{metadata?.topic}</h2>
                      <p className="text-sm text-purple-100">
                        {metadata?.days} days • {metadata?.hours}h/day • {metadata?.goal}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPlanModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm font-bold">{calculateTotalProgress()}%</span>
                  </div>
                  <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${calculateTotalProgress()}%` }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="grid md:grid-cols-2 gap-4">
                  {studyPlan.map((day, dayIndex) => {
                    const dayProgress = calculateDayProgress(dayIndex, day.tasks.length);
                    const isQuizDay = day.type === "quiz" || day.tasks.some(t => t.toLowerCase().includes("quiz"));
                    const isProjectDay = day.type === "project" || day.tasks.some(t => t.toLowerCase().includes("project"));

                    return (
                      <motion.div
                        key={dayIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: dayIndex * 0.05 }}
                        className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-800 rounded-xl p-5 shadow-md border border-gray-300 dark:border-gray-700"
                      >
                        {/* Day Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                                Day {day.day}
                              </span>
                              {isQuizDay && (
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                                  📝 Quiz
                                </span>
                              )}
                              {isProjectDay && (
                                <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                  🚀 Project
                                </span>
                              )}
                            </div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">
                              {day.title}
                            </h3>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-purple-600 dark:text-purple-400">
                              {dayProgress}%
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {day.duration}
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-3 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${dayProgress}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-gray-600 to-gray-700"
                          />
                        </div>

                        {/* Tasks List */}
                        <div className="space-y-2">
                          {day.tasks.map((task, taskIndex) => {
                            const isCompleted = progress[`${dayIndex}-${taskIndex}`];
                            return (
                              <motion.div
                                key={taskIndex}
                                whileHover={{ x: 2 }}
                                onClick={() => toggleTask(dayIndex, taskIndex)}
                                className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/60 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group"
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <Circle className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0 group-hover:text-purple-400" />
                                )}
                                <span
                                  className={`text-sm flex-1 ${
                                    isCompleted
                                      ? "line-through text-gray-500 dark:text-gray-400"
                                      : "text-gray-800 dark:text-gray-200"
                                  }`}
                                >
                                  {task}
                                </span>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                <div className="flex gap-3 justify-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={exportToPDF}
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg flex items-center gap-2 shadow-md transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export PDF
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowPlanModal(false);
                      handleRegenerate();
                    }}
                    className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg flex items-center gap-2 shadow-md transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Regenerate
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
