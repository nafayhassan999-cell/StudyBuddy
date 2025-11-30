"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import AnimatedPage from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import { Brain, ArrowLeft, Sparkles, Loader2, BookOpen, Target, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

interface Flashcard {
  id: number;
  front: string;
  back: string;
}

export default function FlashcardsPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [topic, setTopic] = useState("");
  const [numCards, setNumCards] = useState(5);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  const handleGenerateFlashcards = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    setIsGenerating(true);
    setFlashcards([]);
    setStudyMode(false);

    try {
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate ${numCards} flashcards for studying "${topic}". 
          Return them in this exact JSON format:
          [{"front": "question or term", "back": "answer or definition"}]
          Make them educational and progressively challenging. Only return the JSON array, nothing else.`,
        }),
      });

      const data = await response.json();

      if (response.ok && data.reply) {
        try {
          // Try to parse the AI response as JSON
          const jsonMatch = data.reply.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const cardsWithIds = parsed.map((card: any, index: number) => ({
              id: index + 1,
              front: card.front,
              back: card.back,
            }));
            setFlashcards(cardsWithIds);
            setStudyMode(true);
            setCurrentCardIndex(0);
            toast.success("Flashcards generated!");
          } else {
            throw new Error("Invalid format");
          }
        } catch (parseError) {
          // If parsing fails, create simple cards from the response
          const lines = data.reply.split('\n').filter((line: string) => line.trim());
          const simpleCards = lines.slice(0, numCards).map((line: string, index: number) => ({
            id: index + 1,
            front: `Question ${index + 1} about ${topic}`,
            back: line.trim(),
          }));
          setFlashcards(simpleCards);
          setStudyMode(true);
          toast.success("Flashcards generated!");
        }
      } else {
        throw new Error(data.error || "Failed to generate flashcards");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to generate flashcards");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev + 1) % flashcards.length);
    }, 200);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }, 200);
  };

  const handleShuffle = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    toast.success("Cards shuffled!");
  };

  const handleReset = () => {
    setFlashcards([]);
    setStudyMode(false);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setTopic("");
  };

  if (!isAuthenticated) {
    return null;
  }

  const topicSuggestions = [
    "Photosynthesis",
    "French Revolution",
    "Quadratic Equations",
    "Human Anatomy",
    "Spanish Vocabulary",
    "Chemical Reactions",
    "World Capitals",
    "Programming Basics",
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
              <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">AI Flashcard Generator</h1>
                <p className="text-gray-400">Create study flashcards with AI</p>
              </div>
            </div>
          </motion.div>

          {!studyMode ? (
            /* Generation Form */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8"
            >
              <div className="space-y-6">
                {/* Topic Input */}
                <div>
                  <label className="block text-gray-300 font-medium mb-2">
                    <BookOpen className="w-4 h-4 inline mr-2" />
                    Topic / Subject
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Mitochondria, World War II, Algebra"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                  />
                  {/* Topic Suggestions */}
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

                {/* Number of Cards */}
                <div>
                  <label className="block text-gray-300 font-medium mb-2">
                    <Target className="w-4 h-4 inline mr-2" />
                    Number of Cards
                  </label>
                  <div className="flex gap-2">
                    {[5, 10, 15, 20].map((n) => (
                      <button
                        key={n}
                        onClick={() => setNumCards(n)}
                        className={`px-6 py-3 rounded-xl font-medium transition-all ${
                          numCards === n
                            ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                            : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerateFlashcards}
                  disabled={isGenerating || !topic.trim()}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating Flashcards...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Flashcards
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            /* Study Mode */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Progress Bar */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300">Progress</span>
                  <span className="text-white font-medium">
                    {currentCardIndex + 1} / {flashcards.length}
                  </span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentCardIndex + 1) / flashcards.length) * 100}%` }}
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"
                  />
                </div>
              </div>

              {/* Flashcard */}
              <div className="relative h-80" style={{ perspective: "1000px" }}>
                <motion.div
                  className="w-full h-full cursor-pointer"
                  onClick={() => setIsFlipped(!isFlipped)}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.5 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Front */}
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-rose-500/20 backdrop-blur-md rounded-2xl border border-white/20 p-8 flex items-center justify-center"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">
                        {flashcards[currentCardIndex]?.front}
                      </p>
                      <p className="text-gray-400 mt-4 text-sm">Click to flip</p>
                    </div>
                  </div>

                  {/* Back */}
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-pink-500/20 backdrop-blur-md rounded-2xl border border-white/20 p-8 flex items-center justify-center"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
                    <div className="text-center">
                      <p className="text-xl text-white">
                        {flashcards[currentCardIndex]?.back}
                      </p>
                      <p className="text-gray-400 mt-4 text-sm">Click to flip back</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePrevCard}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                >
                  ← Previous
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShuffle}
                  className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                  title="Shuffle cards"
                >
                  <RotateCcw className="w-5 h-5" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNextCard}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                >
                  Next →
                </motion.button>
              </div>

              {/* Reset Button */}
              <div className="text-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReset}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-medium rounded-xl transition-all"
                >
                  Generate New Flashcards
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </AnimatedPage>
  );
}
