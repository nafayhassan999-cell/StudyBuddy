"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import AnimatedPage from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import { Brain, ArrowLeft, Sparkles, Loader2, Target, CheckCircle, XCircle, Trophy, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizResult {
  question: string;
  userAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
}

export default function QuizGeneratorPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [quizMode, setQuizMode] = useState<"setup" | "quiz" | "results">("setup");
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  const handleGenerateQuiz = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    setIsGenerating(true);
    setQuestions([]);
    setResults([]);

    try {
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate a ${difficulty} difficulty quiz with ${numQuestions} multiple choice questions about "${topic}". 
          Return them in this exact JSON format:
          [{"question": "question text", "options": ["option A", "option B", "option C", "option D"], "correctAnswer": 0}]
          correctAnswer should be the index (0-3) of the correct option. Only return the JSON array, nothing else.`,
        }),
      });

      const data = await response.json();

      if (response.ok && data.reply) {
        try {
          const jsonMatch = data.reply.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const questionsWithIds = parsed.map((q: any, index: number) => ({
              id: index + 1,
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
            }));
            setQuestions(questionsWithIds);
            setQuizMode("quiz");
            setCurrentQuestionIndex(0);
            toast.success("Quiz generated!");
          } else {
            throw new Error("Invalid format");
          }
        } catch (parseError) {
          toast.error("Failed to parse quiz questions");
        }
      } else {
        throw new Error(data.error || "Failed to generate quiz");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to generate quiz");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showAnswer) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) {
      toast.error("Please select an answer");
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    const result: QuizResult = {
      question: currentQuestion.question,
      userAnswer: selectedAnswer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
    };

    setResults([...results, result]);
    setShowAnswer(true);

    if (isCorrect) {
      toast.success("Correct! 🎉");
    } else {
      toast.error("Incorrect!");
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
    } else {
      // Quiz complete
      setQuizMode("results");
      
      // Update quiz count for badges
      const quizCount = parseInt(localStorage.getItem('quizCount') || '0') + 1;
      localStorage.setItem('quizCount', quizCount.toString());
      
      // Save quiz to history
      const quizHistory = JSON.parse(localStorage.getItem('quizzes') || '[]');
      const score = results.filter(r => r.isCorrect).length + (selectedAnswer === questions[currentQuestionIndex]?.correctAnswer ? 1 : 0);
      quizHistory.push({
        topic,
        score,
        total: questions.length,
        percentage: Math.round((score / questions.length) * 100),
        completedAt: new Date().toISOString(),
      });
      localStorage.setItem('quizzes', JSON.stringify(quizHistory));
    }
  };

  const handleReset = () => {
    setQuizMode("setup");
    setQuestions([]);
    setResults([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setTopic("");
  };

  const calculateScore = () => {
    return results.filter((r) => r.isCorrect).length;
  };

  if (!isAuthenticated) {
    return null;
  }

  const topicSuggestions = [
    "Biology",
    "World History",
    "Mathematics",
    "Chemistry",
    "Geography",
    "Literature",
    "Physics",
    "Computer Science",
  ];

  return (
    <AnimatedPage>
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
            
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">AI Quiz Generator</h1>
                <p className="text-gray-400">Test your knowledge with AI-generated quizzes</p>
              </div>
            </div>
          </motion.div>

          {quizMode === "setup" && (
            /* Quiz Setup */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8"
            >
              <div className="space-y-6">
                {/* Topic Input */}
                <div>
                  <label className="block text-gray-300 font-medium mb-2">Topic / Subject</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Solar System, Ancient Rome, Calculus"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {topicSuggestions.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTopic(t)}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm rounded-lg transition-colors"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Number of Questions */}
                <div>
                  <label className="block text-gray-300 font-medium mb-2">Number of Questions</label>
                  <div className="flex gap-2">
                    {[5, 10, 15, 20].map((n) => (
                      <button
                        key={n}
                        onClick={() => setNumQuestions(n)}
                        className={`px-6 py-3 rounded-xl font-medium transition-all ${
                          numQuestions === n
                            ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                            : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-gray-300 font-medium mb-2">Difficulty</label>
                  <div className="flex gap-2">
                    {[
                      { value: "easy", label: "Easy", color: "from-green-500 to-emerald-500" },
                      { value: "medium", label: "Medium", color: "from-yellow-500 to-orange-500" },
                      { value: "hard", label: "Hard", color: "from-red-500 to-pink-500" },
                    ].map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setDifficulty(d.value)}
                        className={`px-6 py-3 rounded-xl font-medium transition-all ${
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

                {/* Generate Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerateQuiz}
                  disabled={isGenerating || !topic.trim()}
                  className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating Quiz...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Quiz
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {quizMode === "quiz" && questions.length > 0 && (
            /* Quiz Mode */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Progress */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300">Question {currentQuestionIndex + 1} of {questions.length}</span>
                  <span className="text-white font-medium">
                    Score: {calculateScore()} / {results.length}
                  </span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  />
                </div>
              </div>

              {/* Question Card */}
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8"
              >
                <h2 className="text-xl font-bold text-white mb-6">
                  {questions[currentQuestionIndex]?.question}
                </h2>

                <div className="space-y-3">
                  {questions[currentQuestionIndex]?.options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect = index === questions[currentQuestionIndex]?.correctAnswer;
                    
                    let buttonClass = "bg-white/5 hover:bg-white/10 border-white/20";
                    
                    if (showAnswer) {
                      if (isCorrect) {
                        buttonClass = "bg-green-500/20 border-green-500";
                      } else if (isSelected && !isCorrect) {
                        buttonClass = "bg-red-500/20 border-red-500";
                      }
                    } else if (isSelected) {
                      buttonClass = "bg-indigo-500/20 border-indigo-500";
                    }

                    return (
                      <motion.button
                        key={index}
                        whileHover={!showAnswer ? { scale: 1.01 } : {}}
                        whileTap={!showAnswer ? { scale: 0.99 } : {}}
                        onClick={() => handleAnswerSelect(index)}
                        disabled={showAnswer}
                        className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${buttonClass}`}
                      >
                        <span className="text-white">{option}</span>
                        {showAnswer && isCorrect && (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        )}
                        {showAnswer && isSelected && !isCorrect && (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-4">
                  {!showAnswer ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmitAnswer}
                      disabled={selectedAnswer === null}
                      className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Answer
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleNextQuestion}
                      className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl"
                    >
                      {currentQuestionIndex < questions.length - 1 ? "Next Question" : "See Results"}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}

          {quizMode === "results" && (
            /* Results */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 text-center"
            >
              <div className="p-6 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full inline-block mb-6">
                <Trophy className="w-16 h-16 text-yellow-400" />
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h2>
              
              <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-4">
                {calculateScore()} / {questions.length}
              </div>
              
              <p className="text-xl text-gray-300 mb-8">
                {calculateScore() === questions.length
                  ? "Perfect Score! Amazing! 🎉"
                  : calculateScore() >= questions.length * 0.7
                  ? "Great job! Keep it up! 👍"
                  : "Keep practicing! You'll get better! 💪"}
              </p>

              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReset}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl flex items-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Take Another Quiz
                </motion.button>
                
                <Link
                  href="/dashboard"
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
                >
                  Back to Dashboard
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </AnimatedPage>
  );
}
