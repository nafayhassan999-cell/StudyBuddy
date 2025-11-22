"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Bot,
  Clock,
  ArrowLeft,
  ArrowRight,
  Send,
  RefreshCw,
  Download,
  Share2,
  CheckCircle2,
  XCircle,
  Loader2,
  Target,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import party from "party-js";

interface Question {
  q: string;
  options: string[];
  answer: string;
  explanation: string;
}

interface ExamMetadata {
  topic: string;
  difficulty: string;
  count: number;
  timeLimit: number;
  generatedAt: string;
}

interface ExamHistory {
  topic: string;
  difficulty: string;
  score: number;
  total: number;
  percentage: number;
  date: string;
}

const difficultyOptions = ["Easy", "Medium", "Hard"];

export default function ExamPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // Setup state
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(30);

  // Exam state
  const [examStarted, setExamStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [metadata, setMetadata] = useState<ExamMetadata | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  // Results state
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [tips, setTips] = useState<string[]>([]);
  const [showExplanation, setShowExplanation] = useState<{ [key: number]: boolean }>({});

  const resultsRef = useRef(null);
  const isInView = useInView(resultsRef, { once: true });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  const handleSubmitExam = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    // Calculate score
    let correctCount = 0;
    const missedTopics: string[] = [];

    questions.forEach((q, index) => {
      if (answers[index] === q.answer) {
        correctCount++;
      } else {
        missedTopics.push(q.q.substring(0, 50));
      }
    });

    setScore(correctCount);
    setExamSubmitted(true);

    const percentage = Math.round((correctCount / questions.length) * 100);

    // Scroll to top to show results
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Trigger confetti for high scores
    if (percentage >= 80) {
      setTimeout(() => {
        const element = document.getElementById("score-circle");
        if (element) {
          party.confetti(element, {
            count: party.variation.range(40, 80),
            spread: party.variation.range(30, 50),
          });
        }
      }, 500);
    }

    // Save to history
    const history: ExamHistory[] = JSON.parse(localStorage.getItem("examHistory") || "[]");
    history.push({
      topic: metadata?.topic || topic,
      difficulty,
      score: correctCount,
      total: questions.length,
      percentage,
      date: new Date().toISOString(),
    });
    localStorage.setItem("examHistory", JSON.stringify(history));

    // Get AI feedback
    try {
      const feedbackResponse = await fetch("/api/ai/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          score: correctCount,
          total: questions.length,
          percentage,
          missedTopics: missedTopics.slice(0, 5),
          difficulty,
          topic: metadata?.topic || topic,
        }),
      });

      const feedbackData = await feedbackResponse.json();
      setFeedback(feedbackData.feedback || "Great effort!");
      setTips(feedbackData.tips || []);
    } catch (error) {
      console.error("Error getting feedback:", error);
      setFeedback("Great effort! Review your answers and keep practicing.");
      setTips(["Study the topics you found challenging", "Take more practice exams"]);
    }
  }, [questions, answers, metadata, topic, difficulty]);

  // Timer countdown
  useEffect(() => {
    if (examStarted && !examSubmitted && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [examStarted, examSubmitted, timeRemaining, handleSubmitExam]);

  const handleStartExam = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/ai/exam", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          difficulty,
          count: questionCount,
          time: timeLimit,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate exam");
      }

      setQuestions(data.questions);
      setMetadata(data.metadata);
      setExamStarted(true);
      setTimeRemaining(timeLimit * 60);
      setAnswers({});
      setCurrentQuestion(0);
      toast.success("Exam started! Good luck! 🎯");
    } catch (error: any) {
      console.error("Error generating exam:", error);
      toast.error(error.message || "AI error, retry");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const handleRetake = () => {
    setExamStarted(false);
    setExamSubmitted(false);
    setQuestions([]);
    setAnswers({});
    setCurrentQuestion(0);
    setScore(0);
    setFeedback("");
    setTips([]);
    setShowExplanation({});
  };

  const handleExportPDF = () => {
    if (questions.length === 0) return;

    try {
      const doc = new jsPDF();
      let yPos = 20;

      // Title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Exam Results", 20, yPos);
      yPos += 10;

      // Metadata
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Topic: ${metadata?.topic || topic}`, 20, yPos);
      yPos += 7;
      doc.text(`Difficulty: ${difficulty}`, 20, yPos);
      yPos += 7;
      doc.text(`Score: ${score}/${questions.length} (${Math.round((score / questions.length) * 100)}%)`, 20, yPos);
      yPos += 12;

      // Questions and answers
      questions.forEach((q, index) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }

        const userAnswer = answers[index] || "Not answered";
        const isCorrect = userAnswer === q.answer;

        // Question
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`Q${index + 1}: ${q.q}`, 20, yPos);
        yPos += 7;

        // User answer
        doc.setFont("helvetica", "normal");
        doc.setTextColor(isCorrect ? 0 : 255, isCorrect ? 128 : 0, 0);
        doc.text(`Your answer: ${userAnswer}`, 25, yPos);
        yPos += 6;

        // Correct answer
        if (!isCorrect) {
          doc.setTextColor(0, 128, 0);
          doc.text(`Correct answer: ${q.answer}`, 25, yPos);
          yPos += 6;
        }

        // Reset color
        doc.setTextColor(0, 0, 0);
        yPos += 5;
      });

      doc.save(`exam-${metadata?.topic || topic}-${Date.now()}.pdf`);
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    }
  };

  const handleShareScore = () => {
    const percentage = Math.round((score / questions.length) * 100);
    toast.success(`Score: ${percentage}% - Copied to clipboard! 📋`, {
      duration: 3000,
    });
    // Mock share functionality
    navigator.clipboard?.writeText(
      `I scored ${percentage}% on a ${difficulty} ${metadata?.topic || topic} exam! 🎯`
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const allAnswered = Object.keys(answers).length === questions.length;
  const percentage = examSubmitted ? Math.round((score / questions.length) * 100) : 0;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section - Not Started */}
        {!examStarted && !examSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Title */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="inline-block p-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl mb-4"
              >
                <Bot className="w-16 h-16 text-emerald-400" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                AI Exam Simulator
              </h1>
              <p className="text-xl text-gray-300">
                Test your knowledge with AI-generated exams
              </p>
            </div>

            {/* Setup Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/20 dark:bg-black/30 white:bg-white/50 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/30 dark:border-gray-700/30"
            >
              <div className="space-y-6">
                {/* Topic Input */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    <Target className="w-4 h-4 inline mr-2" />
                    Topic
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Python Loops, World War II, Calculus"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Difficulty Dropdown */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Difficulty
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 dark:bg-gray-800/90 border border-white/20 rounded-xl text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {difficultyOptions.map((option) => (
                        <option key={option} value={option} className="bg-gray-800 text-white">
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Questions Slider */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Questions: {questionCount}
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="20"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                      className="w-full h-3 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 rounded-lg appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
                        [&::-webkit-slider-thumb]:from-emerald-500 [&::-webkit-slider-thumb]:to-teal-500
                        [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
                    />
                    <div className="flex justify-between mt-1 text-xs text-gray-400">
                      <span>5</span>
                      <span>20</span>
                    </div>
                  </div>
                </div>

                {/* Time Limit Slider */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Time Limit: {timeLimit} minutes
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="5"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                    className="w-full h-3 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 rounded-lg appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
                      [&::-webkit-slider-thumb]:from-emerald-500 [&::-webkit-slider-thumb]:to-teal-500
                      [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
                  />
                  <div className="flex justify-between mt-1 text-xs text-gray-400">
                    <span>10 min</span>
                    <span>60 min</span>
                  </div>
                </div>

                {/* Start Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStartExam}
                  disabled={isGenerating}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-teal-600 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating Exam...
                    </>
                  ) : (
                    <>
                      <Bot className="w-5 h-5" />
                      Start Exam
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>

            {/* Empty State */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center py-12"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                className="inline-block mb-4"
              >
                <Bot className="w-20 h-20 text-emerald-400/50" />
              </motion.div>
              <p className="text-gray-400 text-lg">
                Generate your first AI exam to test your knowledge
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Exam UI - In Progress */}
        {examStarted && !examSubmitted && questions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Header with Timer */}
            <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-white/30 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-white">
                  <span className="text-sm opacity-70">Question</span>
                  <div className="text-2xl font-bold">
                    {currentQuestion + 1}/{questions.length}
                  </div>
                </div>
              </div>
              
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                timeRemaining < 120 
                  ? "bg-red-500/30 border border-red-500/50" 
                  : "bg-white/20 border border-white/30"
              }`}>
                <Clock className={`w-5 h-5 ${timeRemaining < 120 ? "text-red-300" : "text-white"}`} />
                <span className={`text-xl font-mono font-bold ${
                  timeRemaining < 120 ? "text-red-200" : "text-white"
                }`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="bg-white/20 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/30"
              >
                {/* Question Text */}
                <h2 className="text-2xl font-bold text-white mb-6">
                  {questions[currentQuestion].q}
                </h2>

                {/* Options */}
                <div className="space-y-3">
                  {questions[currentQuestion].options.map((option, index) => {
                    const optionLabel = ["A", "B", "C", "D"][index];
                    const isSelected = answers[currentQuestion] === optionLabel;

                    return (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAnswerSelect(currentQuestion, optionLabel)}
                        className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                          isSelected
                            ? "bg-emerald-500/50 border-2 border-emerald-400 shadow-lg"
                            : "bg-white/30 hover:bg-white/50 border-2 border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                            isSelected 
                              ? "bg-emerald-600 text-white" 
                              : "bg-white/50 text-gray-700"
                          }`}>
                            {optionLabel}
                          </span>
                          <span className="flex-1 text-white font-medium">{option}</span>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              <CheckCircle2 className="w-6 h-6 text-emerald-300" />
                            </motion.div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center gap-2 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
                Previous
              </motion.button>

              {currentQuestion === questions.length - 1 ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmitExam}
                  disabled={!allAnswered}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-teal-600 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center gap-2 shadow-lg transition-all"
                >
                  <Send className="w-5 h-5" />
                  Submit Exam
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentQuestion((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl flex items-center gap-2 transition-all"
                >
                  Next
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              )}
            </div>

            {/* Progress Indicator */}
            <div className="bg-white/10 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((Object.keys(answers).length) / questions.length) * 100}%` }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
              />
            </div>
            <p className="text-center text-gray-300 text-sm">
              {Object.keys(answers).length} of {questions.length} questions answered
            </p>
          </motion.div>
        )}

        {/* Results Page */}
        {examSubmitted && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Score Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              className="bg-white/20 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/30 text-center"
            >
              <h2 className="text-3xl font-bold text-white mb-6">Exam Results</h2>

              {/* Score Circle */}
              <motion.div
                id="score-circle"
                initial={{ scale: 0 }}
                animate={isInView ? { scale: 1 } : {}}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="inline-block mb-6"
              >
                <div className={`relative w-40 h-40 rounded-full flex items-center justify-center ${
                  percentage >= 70 
                    ? "bg-gradient-to-br from-green-500 to-emerald-600" 
                    : percentage >= 50
                    ? "bg-gradient-to-br from-yellow-500 to-orange-600"
                    : "bg-gradient-to-br from-gray-600 to-gray-700"
                }`}>
                  <div className="text-center">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={isInView ? { opacity: 1 } : {}}
                      transition={{ delay: 0.5 }}
                      className="text-5xl font-bold text-white"
                    >
                      {percentage}%
                    </motion.div>
                    <div className="text-sm text-white/80">
                      {score}/{questions.length}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Feedback */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.6 }}
                className="mb-6"
              >
                <p className="text-lg text-white/90 mb-4">{feedback}</p>
                {tips.length > 0 && (
                  <div className="bg-white/10 rounded-xl p-4 text-left">
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      Tips for Improvement:
                    </h3>
                    <ul className="space-y-2">
                      {tips.map((tip, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={isInView ? { opacity: 1, x: 0 } : {}}
                          transition={{ delay: 0.7 + index * 0.1 }}
                          className="text-white/80 flex items-start gap-2"
                        >
                          <span className="text-emerald-400 mt-1">•</span>
                          <span>{tip}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.9 }}
                className="flex flex-wrap gap-3 justify-center"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRetake}
                  className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-white font-semibold rounded-xl flex items-center gap-2 shadow-lg transition-all"
                >
                  <RefreshCw className="w-5 h-5" />
                  Retake
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleExportPDF}
                  className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl flex items-center gap-2 transition-all"
                >
                  <Download className="w-5 h-5" />
                  Save PDF
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShareScore}
                  className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl flex items-center gap-2 transition-all"
                >
                  <Share2 className="w-5 h-5" />
                  Share Score
                </motion.button>
              </motion.div>
            </motion.div>

            {/* Questions Review */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 1.0 }}
              className="space-y-4"
            >
              <h3 className="text-2xl font-bold text-white mb-4">Review Your Answers</h3>
              
              {questions.map((q, index) => {
                const userAnswer = answers[index];
                const isCorrect = userAnswer === q.answer;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 1.1 + index * 0.05 }}
                    className="bg-white/20 backdrop-blur-xl rounded-xl p-6 shadow-xl border border-white/30"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      {isCorrect ? (
                        <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                      )}
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-white mb-2">
                          Question {index + 1}: {q.q}
                        </h4>
                        
                        <div className="space-y-2 text-sm">
                          <div className={`${isCorrect ? "text-green-300" : "text-red-300 line-through"}`}>
                            Your answer: <span className="font-semibold">{userAnswer || "Not answered"}</span>
                          </div>
                          {!isCorrect && (
                            <div className="text-green-300">
                              Correct answer: <span className="font-semibold">{q.answer}</span>
                            </div>
                          )}
                        </div>

                        {/* Explanation Toggle */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowExplanation((prev) => ({
                            ...prev,
                            [index]: !prev[index],
                          }))}
                          className="mt-3 text-sm text-emerald-300 hover:text-emerald-200 flex items-center gap-2"
                        >
                          <AlertCircle className="w-4 h-4" />
                          {showExplanation[index] ? "Hide" : "Show"} Explanation
                        </motion.button>

                        <AnimatePresence>
                          {showExplanation[index] && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3 p-4 bg-white/10 rounded-lg text-white/80 text-sm"
                            >
                              {q.explanation}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
