"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Brain, Loader2, CheckCircle, XCircle, Award, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import party from "party-js";

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export default function QuizModal({ isOpen, onClose, onComplete }: QuizModalProps) {
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [aiFeedback, setAiFeedback] = useState("");
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const generateQuiz = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    setIsGenerating(true);

    try {
      const prompt = `Generate exactly 5 multiple choice quiz questions about "${topic}". Return ONLY valid JSON in this exact format with no additional text or markdown:
[{"question": "question text", "options": ["A) option1", "B) option2", "C) option3", "D) option4"], "answer": "A"}]
The answer field should be just the letter (A, B, C, or D).`;

      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (response.ok && data.reply) {
        // Extract JSON from response
        let jsonText = data.reply.trim();
        
        // Remove markdown code blocks if present
        jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
        
        // Find JSON array in the text
        const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          jsonText = jsonMatch[0];
        }

        const parsedQuestions = JSON.parse(jsonText);

        if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
          setQuestions(parsedQuestions);
          setUserAnswers(new Array(parsedQuestions.length).fill(""));
          
          toast.success(`Generated ${parsedQuestions.length} questions!`);
        } else {
          toast.error("Invalid quiz format received");
        }
      } else {
        toast.error(data.error || "Failed to generate quiz");
      }
    } catch (error) {
      console.error("Quiz generation error:", error);
      toast.error("Failed to generate quiz. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const submitQuiz = async () => {
    if (userAnswers.some((answer) => !answer)) {
      toast.error("Please answer all questions");
      return;
    }

    let correctCount = 0;
    const missedTopics: string[] = [];

    questions.forEach((question, index) => {
      if (userAnswers[index] === question.answer) {
        correctCount++;
      } else {
        missedTopics.push(question.question);
      }
    });

    const percentage = Math.round((correctCount / questions.length) * 100);
    setScore(correctCount);
    setShowResults(true);

    // Save to localStorage
    const savedQuizzes = JSON.parse(localStorage.getItem("quizzes") || "[]");
    savedQuizzes.push({
      topic,
      score: correctCount,
      total: questions.length,
      percentage,
      completedAt: new Date().toISOString(),
    });
    localStorage.setItem("quizzes", JSON.stringify(savedQuizzes));

    // Update average score in localStorage
    const totalScore = savedQuizzes.reduce((sum: number, q: any) => sum + q.percentage, 0);
    const avgScore = Math.round(totalScore / savedQuizzes.length);
    localStorage.setItem("avgQuizScore", avgScore.toString());

    // Call onComplete callback for badge tracking
    if (onComplete) {
      onComplete();
    }

    // Perfect score confetti!
    if (correctCount === questions.length && resultsRef.current) {
      setTimeout(() => {
        if (resultsRef.current) {
          party.confetti(resultsRef.current, {
            count: party.variation.range(80, 120),
            spread: party.variation.range(40, 60),
          });
        }
      }, 500);
      toast.success("🎉 Perfect score! Amazing work!", {
        icon: "🏆",
        duration: 4000,
      });
    } else {
      toast.success(`Quiz completed! Score: ${correctCount}/${questions.length}`);
    }

    // Generate AI feedback
    if (percentage < 100) {
      setIsLoadingFeedback(true);
      try {
        const response = await fetch("/api/ai/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            score: correctCount,
            total: questions.length,
            percentage,
            missedTopics: missedTopics.slice(0, 3), // Send first 3 missed questions
            topic,
          }),
        });

        const data = await response.json();
        if (response.ok && data.feedback) {
          setAiFeedback(data.feedback);
        }
      } catch (error) {
        console.error("Error getting feedback:", error);
      } finally {
        setIsLoadingFeedback(false);
      }
    }
  };

  const handleClose = () => {
    setTopic("");
    setQuestions([]);
    setUserAnswers([]);
    setShowResults(false);
    setScore(0);
    onClose();
  };

  const resetQuiz = () => {
    setQuestions([]);
    setUserAnswers([]);
    setShowResults(false);
    setScore(0);
    setAiFeedback("");
    setIsLoadingFeedback(false);
    setTopic("");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-white/20 w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-600/20 to-gray-700/20 p-6 border-b border-white/20 flex items-center justify-between">
            <div className="flex items-center">
              <Brain className="w-8 h-8 text-purple-400 mr-3" />
              <div>
                <h2 className="text-2xl font-bold text-white">Generate Quiz</h2>
                <p className="text-gray-300 text-sm">Test your knowledge</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-6 h-6 text-gray-300" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Input Section */}
            {questions.length === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2 font-medium">
                    What topic do you want to quiz on?
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && generateQuiz()}
                    placeholder="e.g., JavaScript Arrays, Biology Cells, History..."
                    disabled={isGenerating}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generateQuiz}
                  disabled={isGenerating}
                  className="w-full px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5" />
                      Generate Quiz
                    </>
                  )}
                </motion.button>
              </div>
            )}

            {/* Quiz Questions */}
            {questions.length > 0 && !showResults && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Topic: {topic}</h3>
                    <p className="text-gray-400 text-sm">{questions.length} questions</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {questions.map((question, qIndex) => (
                    <motion.div
                      key={qIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: qIndex * 0.1 }}
                      className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/20"
                    >
                      <h4 className="text-lg font-semibold text-white mb-4">
                        {qIndex + 1}. {question.question}
                      </h4>

                      <div className="space-y-3">
                        {question.options.map((option, oIndex) => {
                          const optionLetter = option.charAt(0);
                          const isSelected = userAnswers[qIndex] === optionLetter;

                          return (
                            <motion.label
                              key={oIndex}
                              whileHover={{ scale: 1.02 }}
                              className={`flex items-center p-4 rounded-lg cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-purple-500/30 border-purple-400"
                                  : "bg-white/5 border-white/10 hover:bg-white/10"
                              } border-2`}
                            >
                              <input
                                type="radio"
                                name={`question-${qIndex}`}
                                value={optionLetter}
                                checked={isSelected}
                                onChange={() => handleAnswerSelect(qIndex, optionLetter)}
                                className="w-5 h-5 mr-3 accent-purple-500"
                              />
                              <span className="text-white">{option}</span>
                            </motion.label>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={submitQuiz}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Submit Quiz
                </motion.button>
              </div>
            )}

            {/* Results */}
            {showResults && (
              <motion.div
                ref={resultsRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* Score Card with Badge */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`bg-gradient-to-br backdrop-blur-md rounded-xl p-8 border-2 text-center ${
                    score / questions.length >= 0.7
                      ? "from-green-500/20 to-emerald-500/20 border-green-500/50"
                      : score / questions.length >= 0.5
                      ? "from-yellow-500/20 to-orange-500/20 border-yellow-500/50"
                      : "from-gray-600/20 to-gray-700/20 border-gray-500/50"
                  }`}
                >
                  <div className="flex items-center justify-center gap-3 mb-4">
                    {score === questions.length && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                      >
                        <Award className="w-12 h-12 text-yellow-400" />
                      </motion.div>
                    )}
                    <h3 className="text-3xl font-bold text-white">
                      {score === questions.length
                        ? "Perfect Score!"
                        : score / questions.length >= 0.7
                        ? "Great Job!"
                        : score / questions.length >= 0.5
                        ? "Good Effort!"
                        : "Keep Practicing!"}
                    </h3>
                  </div>
                  
                  <motion.div
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 150, delay: 0.4 }}
                  >
                    <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full mb-4 ${
                      score / questions.length >= 0.7
                        ? "bg-green-500/30 border-2 border-green-400"
                        : score / questions.length >= 0.5
                        ? "bg-yellow-500/30 border-2 border-yellow-400"
                        : "bg-red-500/30 border-2 border-red-400"
                    }`}>
                      <span className="text-5xl font-bold text-white">{score}/{questions.length}</span>
                    </div>
                  </motion.div>
                  
                  <p className="text-2xl font-semibold text-gray-300">
                    {Math.round((score / questions.length) * 100)}% Correct
                  </p>
                </motion.div>

                {/* AI Feedback */}
                {(aiFeedback || isLoadingFeedback) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-md rounded-xl p-6 border border-blue-400/30"
                  >
                    <div className="flex items-start gap-3">
                      <Brain className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                          AI Feedback
                          {isLoadingFeedback && (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                          )}
                        </h4>
                        {isLoadingFeedback ? (
                          <p className="text-gray-400 text-sm">Analyzing your performance...</p>
                        ) : (
                          <p className="text-gray-300 text-sm leading-relaxed">{aiFeedback}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Answer Review with Stagger Animation */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1,
                        delayChildren: 0.6,
                      },
                    },
                  }}
                  className="space-y-4"
                >
                  <h4 className="text-xl font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Review Answers
                  </h4>
                  {questions.map((question, index) => {
                    const isCorrect = userAnswers[index] === question.answer;
                    const userAnswer = question.options.find((opt) =>
                      opt.startsWith(userAnswers[index])
                    );
                    const correctAnswer = question.options.find((opt) =>
                      opt.startsWith(question.answer)
                    );

                    return (
                      <motion.div
                        key={index}
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          visible: { opacity: 1, y: 0 },
                        }}
                        className={`bg-white/5 backdrop-blur-md rounded-xl p-6 border-2 ${
                          isCorrect ? "border-green-500/50" : "border-red-500/50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {isCorrect ? (
                            <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                          )}
                          <div className="flex-1">
                            <h5 className="text-white font-semibold mb-3">
                              {index + 1}. {question.question}
                            </h5>
                            <div className="space-y-2 text-sm">
                              <p className="text-gray-300">
                                <span className="font-medium">Your answer:</span>{" "}
                                <span
                                  className={`${
                                    isCorrect
                                      ? "text-green-400 font-semibold"
                                      : "text-red-400 line-through decoration-2"
                                  }`}
                                >
                                  {userAnswer}
                                </span>
                              </p>
                              {!isCorrect && (
                                <p className="text-gray-300">
                                  <span className="font-medium">Correct answer:</span>{" "}
                                  <span className="text-green-400 font-bold">{correctAnswer}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0 }}
                  className="flex gap-3"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={resetQuiz}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Retake Quiz
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
