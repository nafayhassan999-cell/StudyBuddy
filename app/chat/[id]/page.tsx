'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AnimatedPage from '@/components/AnimatedPage';
import toast from 'react-hot-toast';

interface Message {
  id: number;
  text: string;
  senderId: number;
  timestamp: string;
  seen: boolean;
}

interface Buddy {
  id: number;
  name: string;
  avatar: string;
  isOnline: boolean;
}

// Mock buddies data
const mockBuddies: Record<number, Buddy> = {
  1: { id: 1, name: 'Sarah Chen', avatar: 'SC', isOnline: true },
  2: { id: 2, name: 'Marcus Rodriguez', avatar: 'MR', isOnline: false },
  3: { id: 3, name: 'Emma Thompson', avatar: 'ET', isOnline: true },
  4: { id: 4, name: 'James Wilson', avatar: 'JW', isOnline: true },
};

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const buddyId = Number(params.id);
  const buddy = mockBuddies[buddyId];

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Generate user ID from email for consistent identification
  const userId = user?.email ? user.email.charCodeAt(0) : 0;

  // Load messages from localStorage or use mock data
  useEffect(() => {
    const storageKey = `chat_${buddyId}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      setMessages(JSON.parse(stored));
    } else {
      // Mock initial messages
      const initialMessages: Message[] = [
        {
          id: 1,
          text: 'Hey! Would you like to study together this weekend?',
          senderId: buddyId,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          seen: true,
        },
        {
          id: 2,
          text: 'That sounds great! What subject are you focusing on?',
          senderId: userId,
          timestamp: new Date(Date.now() - 3000000).toISOString(),
          seen: true,
        },
        {
          id: 3,
          text: 'I was thinking we could cover Data Structures. I have an exam coming up.',
          senderId: buddyId,
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          seen: true,
        },
      ];
      setMessages(initialMessages);
      localStorage.setItem(storageKey, JSON.stringify(initialMessages));
    }
  }, [buddyId, userId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mock real-time polling every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate receiving a new message (10% chance every 5s)
      if (Math.random() > 0.9) {
        const newMessage: Message = {
          id: Date.now(),
          text: [
            'Sounds good to me!',
            'What time works for you?',
            'I&apos;m free after 3 PM.',
            'Let&apos;s meet at the library.',
            'Perfect! See you then.',
          ][Math.floor(Math.random() * 5)],
          senderId: buddyId,
          timestamp: new Date().toISOString(),
          seen: false,
        };

        setMessages((prev) => {
          const updated = [...prev, newMessage];
          localStorage.setItem(`chat_${buddyId}`, JSON.stringify(updated));
          return updated;
        });

        // Show notification
        toast.success(`New message from ${buddy?.name}`, {
          icon: '💬',
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [buddyId, buddy?.name]);

  // Handle send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    setIsSending(true);
    const newMessage: Message = {
      id: Date.now(),
      text: inputValue,
      senderId: userId,
      timestamp: new Date().toISOString(),
      seen: false,
    };

    // Optimistically add message
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInputValue('');

    try {
      // POST to API
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buddyId,
          text: newMessage.text,
        }),
      });

      if (response.ok) {
        // Mark as seen after 2 seconds
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === newMessage.id ? { ...msg, seen: true } : msg
            )
          );
        }, 2000);

        // Save to localStorage
        localStorage.setItem(`chat_${buddyId}`, JSON.stringify(updatedMessages));
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      toast.error('Failed to send message');
      // Remove message on error
      setMessages(messages);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (!user) return null;
  if (!buddy) {
    return (
      <AnimatedPage>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">Buddy not found</h2>
            <button
              onClick={() => router.push('/search')}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg"
            >
              Find Buddies
            </button>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 pt-24 pb-8 px-4">
        <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)]">
          {/* Glass Chat Window */}
          <div className="h-full backdrop-blur-xl bg-white/60 rounded-3xl shadow-2xl border border-white/20 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-xl p-4 flex items-center gap-4 border-b border-white/20">
              <button
                onClick={() => router.push('/search')}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {buddy.avatar}
                </div>
                {buddy.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg" />
                )}
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">{buddy.name}</h2>
                <p className="text-sm text-white/80">
                  {buddy.isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <AnimatePresence mode="popLayout">
                {messages.map((message, index) => {
                  const isUser = message.senderId === userId;
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{
                        delay: index * 0.05,
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                      }}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-md ${
                          isUser
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-sm'
                            : 'bg-white/80 backdrop-blur-sm text-gray-800 rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        <div
                          className={`flex items-center gap-1 mt-1 text-xs ${
                            isUser ? 'text-white/70 justify-end' : 'text-gray-500'
                          }`}
                        >
                          <span>{formatTime(message.timestamp)}</span>
                          {isUser && (
                            <span>
                              {message.seen ? (
                                <CheckCheck className="w-3 h-3" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="p-4 bg-white/40 backdrop-blur-xl border-t border-white/20"
            >
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 rounded-xl bg-white/80 backdrop-blur-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 placeholder-gray-400"
                  disabled={isSending}
                />
                <motion.button
                  type="submit"
                  disabled={!inputValue.trim() || isSending}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send
                </motion.button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
