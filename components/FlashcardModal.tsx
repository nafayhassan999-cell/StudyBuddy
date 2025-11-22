"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FlashcardModal({ isOpen, onClose }: FlashcardModalProps) {
  const [topic, setTopic] = useState("");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);

  const generateFlashcards = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    setIsGenerating(true);

    try {
      const prompt = `Generate exactly 5 flashcards about "${topic}" as a JSON array. Each flashcard should have educational content. Return ONLY valid JSON in this exact format with no additional text or markdown:
[{"front": "question or term", "back": "answer or definition"}]`;

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

        const parsedFlashcards = JSON.parse(jsonText);

        if (Array.isArray(parsedFlashcards) && parsedFlashcards.length > 0) {
          setFlashcards(parsedFlashcards);
          
          // Save to localStorage
          const savedFlashcards = JSON.parse(localStorage.getItem("flashcards") || "{}");
          savedFlashcards[topic] = {
            cards: parsedFlashcards,
            createdAt: new Date().toISOString(),
          };
          localStorage.setItem("flashcards", JSON.stringify(savedFlashcards));
          
          toast.success(`Generated ${parsedFlashcards.length} flashcards!`);
        } else {
          toast.error("Invalid flashcard format received");
        }
      } else {
        toast.error(data.error || "Failed to generate flashcards");
      }
    } catch (error) {
      console.error("Flashcard generation error:", error);
      toast.error("Failed to generate flashcards. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFlip = (index: number) => {
    setFlippedIndex(flippedIndex === index ? null : index);
  };

  const handleClose = () => {
    setTopic("");
    setFlashcards([]);
    setFlippedIndex(null);
    onClose();
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
              <Sparkles className="w-8 h-8 text-blue-400 mr-3" />
              <div>
                <h2 className="text-2xl font-bold text-white">Generate Flashcards</h2>
                <p className="text-gray-300 text-sm">AI-powered study cards</p>
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
            {flashcards.length === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2 font-medium">
                    What topic do you want to study?
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && generateFlashcards()}
                    placeholder="e.g., Photosynthesis, Python Loops, World War II..."
                    disabled={isGenerating}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generateFlashcards}
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
                      <Sparkles className="w-5 h-5" />
                      Generate Flashcards
                    </>
                  )}
                </motion.button>
              </div>
            )}

            {/* Flashcards Display */}
            {flashcards.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Topic: {topic}</h3>
                    <p className="text-gray-400 text-sm">Click cards to flip them</p>
                  </div>
                  <button
                    onClick={() => {
                      setFlashcards([]);
                      setTopic("");
                      setFlippedIndex(null);
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    Generate New
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {flashcards.map((card, index) => (
                    <div
                      key={index}
                      className="perspective-1000 h-64"
                      style={{ perspective: "1000px" }}
                    >
                      <motion.div
                        className="relative w-full h-full cursor-pointer"
                        onClick={() => handleFlip(index)}
                        animate={{ rotateY: flippedIndex === index ? 180 : 0 }}
                        transition={{ duration: 0.6, type: "spring" }}
                        style={{ transformStyle: "preserve-3d" }}
                      >
                        {/* Front */}
                        <div
                          className="absolute inset-0 bg-gradient-to-br from-gray-600/20 to-gray-700/20 backdrop-blur-md rounded-xl p-6 border border-white/20 flex flex-col items-center justify-center text-center"
                          style={{
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                          }}
                        >
                          <p className="text-sm text-gray-400 mb-2">Question {index + 1}</p>
                          <p className="text-lg font-semibold text-white">{card.front}</p>
                          <p className="text-xs text-gray-400 mt-4">Click to reveal answer</p>
                        </div>

                        {/* Back */}
                        <div
                          className="absolute inset-0 bg-gradient-to-br from-gray-700/20 to-gray-800/20 backdrop-blur-md rounded-xl p-6 border border-white/20 flex flex-col items-center justify-center text-center"
                          style={{
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            transform: "rotateY(180deg)",
                          }}
                        >
                          <p className="text-sm text-gray-400 mb-2">Answer {index + 1}</p>
                          <p className="text-lg font-semibold text-white">{card.back}</p>
                          <p className="text-xs text-gray-400 mt-4">Click to flip back</p>
                        </div>
                      </motion.div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
