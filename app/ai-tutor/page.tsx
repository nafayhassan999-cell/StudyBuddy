"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import AnimatedPage from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import { Bot, Send, Copy, Check, ArrowLeft, Sparkles, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

interface Message {
  role: "user" | "ai";
  text: string;
}

export default function AITutorPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Load saved messages from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem('ai_tutor_messages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ai_tutor_messages', JSON.stringify(messages));
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;

    const userMessage = inputText.trim();
    setInputText("");
    setIsSending(true);

    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsTyping(true);

    try {
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage }),
      });

      const data = await response.json();

      setTimeout(() => {
        setIsTyping(false);

        if (response.ok && data.reply) {
          setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
          
          // Update AI usage count for badges
          const aiUsageCount = parseInt(localStorage.getItem('aiUsageCount') || '0') + 1;
          localStorage.setItem('aiUsageCount', aiUsageCount.toString());
        } else if (response.status === 429) {
          setMessages((prev) => [
            ...prev,
            { role: "ai", text: "🔄 I'm a bit busy right now! Please wait about 30 seconds and try again." },
          ]);
          toast.error("AI is rate limited. Please wait and try again.", { duration: 5000 });
        } else {
          setMessages((prev) => [
            ...prev,
            { role: "ai", text: data.error || "Sorry, I couldn't process that. Please try again." },
          ]);
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('ai_tutor_messages');
    toast.success("Chat cleared!");
  };

  if (!isAuthenticated) {
    return null;
  }

  const suggestedQuestions = [
    "Explain photosynthesis in simple terms",
    "Help me understand quadratic equations",
    "What are the key events of World War II?",
    "Explain Newton's laws of motion",
    "How do I improve my essay writing?",
    "What is the Pythagorean theorem?",
  ];

  return (
    <AnimatedPage>
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white">AI Tutor</h1>
                  <p className="text-gray-400">Your personal study assistant powered by AI</p>
                </div>
              </div>
              
              {messages.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearChat}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Chat
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Chat Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden"
          >
            {/* Chat Messages */}
            <div className="h-[60vh] overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="p-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full mb-6">
                    <Sparkles className="w-16 h-16 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Start a Conversation</h3>
                  <p className="text-gray-400 mb-8 max-w-md">
                    Ask me anything about your studies! I can help with math, science, history, languages, and more.
                  </p>
                  
                  {/* Suggested Questions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                    {suggestedQuestions.map((question, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setInputText(question)}
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left text-gray-300 text-sm transition-all"
                      >
                        {question}
                      </motion.button>
                    ))}
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
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
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
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  <span className="hidden sm:inline">Send</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </AnimatedPage>
  );
}
