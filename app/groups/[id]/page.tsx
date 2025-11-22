'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Lock, Globe, ArrowLeft, MessageSquare, UserPlus, Calendar, Search, X, Send, Upload, FileText, Download, Image as ImageIcon, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AnimatedPage from '@/components/AnimatedPage';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { createClient } from '@/lib/supabase/client';

interface Group {
  id: string;
  name: string;
  subject: string;
  privacy: string;
  creator: string;
  members: string[];
  createdAt: string;
}

interface Connection {
  id: number;
  name: string;
  email: string;
  avatar: string;
  subjects: string[];
}

interface GroupMessage {
  id: number;
  sender: string;
  text: string;
  timestamp: string;
}

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  timestamp: string;
}

interface StudySession {
  id: string;
  date: string;
  time: string;
  topic: string;
  createdBy: string;
  createdAt: string;
  userRsvp?: 'going' | 'maybe' | 'not-going';
  attendees?: {
    going: number;
    maybe: number;
    notGoing: number;
  };
}

// Mock connections data
const mockConnections: Connection[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', avatar: 'AJ', subjects: ['Math', 'Physics'] },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', avatar: 'BS', subjects: ['Science', 'Chemistry'] },
  { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', avatar: 'CB', subjects: ['History', 'English'] },
  { id: 4, name: 'Diana Prince', email: 'diana@example.com', avatar: 'DP', subjects: ['Computer Science'] },
  { id: 5, name: 'Ethan Hunt', email: 'ethan@example.com', avatar: 'EH', subjects: ['Math', 'Science'] },
];

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [isSendingInvites, setIsSendingInvites] = useState(false);
  const [chatMessages, setChatMessages] = useState<GroupMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [sessionForm, setSessionForm] = useState({
    date: '',
    time: '',
    topic: '',
  });
  const [sessionErrors, setSessionErrors] = useState({
    date: '',
    time: '',
    topic: '',
  });
  const [isScheduling, setIsScheduling] = useState(false);
  const [hasNewReminder, setHasNewReminder] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    timestamp: string;
    read: boolean;
    sessionId: string;
  }>>([]);
  const reminderTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const notificationRef = useRef<HTMLDivElement>(null);
  const groupId = params.id as string;

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  // Load group data
  useEffect(() => {
    if (!groupId) return;

    try {
      const storedGroups = JSON.parse(localStorage.getItem('study_groups') || '[]');
      const foundGroup = storedGroups.find((g: Group) => g.id === groupId);

      if (foundGroup) {
        setGroup(foundGroup);
      } else {
        toast.error('Group not found');
      }
    } catch (error) {
      console.error('Error loading group:', error);
      toast.error('Failed to load group');
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  // Load initial messages from Supabase and setup realtime subscription
  useEffect(() => {
    if (!groupId) return;

    // Load initial messages
    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            profiles:sender_id (
              name,
              email
            )
          `)
          .eq('group_id', groupId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        const formattedMessages: GroupMessage[] = (data || []).map((msg: any) => ({
          id: msg.id,
          sender: msg.profiles?.name || msg.profiles?.email?.split('@')[0] || 'Anonymous',
          text: msg.content,
          timestamp: msg.created_at,
        }));

        setChatMessages(formattedMessages);
      } catch (error: any) {
        console.error('Failed to load messages:', error);
        toast.error('Failed to load messages');
      }
    };

    loadMessages();

    // Setup realtime subscription for new messages
    const channel = supabase
      .channel(`group-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload: any) => {
          // Fetch sender profile info
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('user_id', payload.new.sender_id)
            .single();

          const newMessage: GroupMessage = {
            id: payload.new.id,
            sender: profile?.name || profile?.email?.split('@')[0] || 'Anonymous',
            text: payload.new.content,
            timestamp: payload.new.created_at,
          };

          setChatMessages((prev) => [...prev, newMessage]);
          
          // Show toast notification for messages from others
          const { data: { user } } = await supabase.auth.getUser();
          if (user && payload.new.sender_id !== user.id) {
            toast.success(`New message from ${newMessage.sender}`, {
              icon: '💬',
              duration: 2000,
            });
          }

          // Scroll to bottom
          setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, supabase]);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get sender color based on name
  const getSenderColor = (sender: string) => {
    const colors = [
      'text-blue-400',
      'text-purple-400',
      'text-pink-400',
      'text-green-400',
      'text-yellow-400',
      'text-orange-400',
    ];
    const index = sender.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Handle send chat message with Supabase realtime
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSendingMessage || !user) return;

    setIsSendingMessage(true);
    const messageText = chatInput;
    setChatInput('');

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('messages')
        .insert({
          group_id: groupId,
          sender_id: authUser.id,
          content: messageText,
          type: 'text',
        });

      if (error) throw error;

      // Scroll to bottom after sending
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      setChatInput(messageText); // Restore message on error
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Load uploaded files from localStorage
  useEffect(() => {
    if (!groupId) return;

    const storageKey = `group_files_${groupId}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      setUploadedFiles(JSON.parse(stored));
    }
  }, [groupId]);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB', {
        icon: '⚠️',
        duration: 3000,
      });
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('groupId', groupId);
      formData.append('uploadedBy', user?.name || user?.email.split('@')[0] || 'Unknown');

      // Mock progress bar
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (response.ok && data.success) {
        const newFile: UploadedFile = {
          id: data.fileId,
          name: data.name,
          url: data.url,
          type: file.type,
          size: file.size,
          uploadedBy: user?.name || user?.email.split('@')[0] || 'Unknown',
          timestamp: new Date().toISOString(),
        };

        const updatedFiles = [...uploadedFiles, newFile];
        setUploadedFiles(updatedFiles);
        localStorage.setItem(`group_files_${groupId}`, JSON.stringify(updatedFiles));

        toast.success('File uploaded successfully! 📎', {
          icon: '✅',
          duration: 2000,
        });

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        throw new Error(data.error || 'Failed to upload');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Get file icon based on type
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon;
    return FileText;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Load study sessions from localStorage
  useEffect(() => {
    if (!groupId) return;

    const storageKey = `group_sessions_${groupId}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      setStudySessions(JSON.parse(stored));
    }
  }, [groupId]);

  // Schedule reminders for existing sessions
  useEffect(() => {
    const timers = reminderTimersRef.current;
    
    // Clear existing timers
    timers.forEach(timer => clearTimeout(timer));
    timers.clear();

    // Schedule reminders for all upcoming sessions
    studySessions.forEach(session => {
      // Calculate time until session (minus 1 hour for reminder)
      const sessionDateTime = new Date(`${session.date}T${session.time}`);
      const reminderTime = new Date(sessionDateTime.getTime() - 60 * 60 * 1000); // 1 hour before
      const now = new Date();
      const timeUntilReminder = reminderTime.getTime() - now.getTime();

      // For development: Use 1 minute instead of 1 hour
      const devReminderDelay = 60 * 1000; // 1 minute
      
      console.log(`[Reminder] Session: "${session.topic}"`);
      console.log(`[Reminder] Session time: ${sessionDateTime.toLocaleString()}`);
      console.log(`[Reminder] Reminder scheduled for: ${reminderTime.toLocaleString()}`);
      console.log(`[Reminder] Time until reminder: ${Math.round(timeUntilReminder / 1000)} seconds (${Math.round(devReminderDelay / 1000)}s in dev mode)`);
      const reminderDelay = process.env.NODE_ENV === 'development' ? devReminderDelay : timeUntilReminder;

      // Only schedule if reminder time is in the future
      if (reminderDelay > 0) {
        const timerId = setTimeout(async () => {
          try {
            // Mock recipients (in production, get actual user emails)
            const mockRecipients = [
              { name: user?.name || 'User', email: user?.email || 'user@example.com' }
            ];

            // Send reminder via API
            const response = await fetch('/api/reminders/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: session.id,
                sessionData: {
                  topic: session.topic,
                  date: session.date,
                  time: session.time,
                },
                recipients: mockRecipients,
              }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
              // Add notification to list
              const newNotification = {
                id: `notif_${Date.now()}`,
                message: `Session "${session.topic}" starts soon at ${session.time}`,
                timestamp: new Date().toISOString(),
                read: false,
                sessionId: session.id,
              };
              
              setNotifications(prev => [newNotification, ...prev]);
              
              // Show notification
              setHasNewReminder(true);
              
              // Mock email notification via toast
              toast(
                `📧 Email reminder: Session "${session.topic}" starts soon!`,
                {
                  duration: 5000,
                  icon: '🔔',
                }
              );

              // Also show regular toast
              toast.success('Reminder sent to all attendees! 🔔', {
                duration: 3000,
              });

              // Reset reminder indicator after 5 seconds
              setTimeout(() => setHasNewReminder(false), 5000);
            }
          } catch (error) {
            console.error('Error sending reminder:', error);
          }

          // Clean up timer reference
          timers.delete(session.id);
        }, reminderDelay);

        // Store timer reference
        timers.set(session.id, timerId);
      }
    });

    // Cleanup on unmount
    return () => {
      timers.forEach(timer => clearTimeout(timer));
      timers.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studySessions]);

  // Validate session form
  const validateSessionForm = () => {
    const errors = {
      date: '',
      time: '',
      topic: '',
    };
    let isValid = true;

    // Validate date (must be in the future)
    if (!sessionForm.date) {
      errors.date = 'Date is required';
      isValid = false;
    } else {
      const selectedDate = new Date(sessionForm.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        errors.date = 'Date must be in the future';
        isValid = false;
      }
    }

    // Validate time
    if (!sessionForm.time) {
      errors.time = 'Time is required';
      isValid = false;
    }

    // Validate topic (min 5 characters)
    if (!sessionForm.topic.trim()) {
      errors.topic = 'Topic is required';
      isValid = false;
    } else if (sessionForm.topic.trim().length < 5) {
      errors.topic = 'Topic must be at least 5 characters';
      isValid = false;
    }

    setSessionErrors(errors);
    return isValid;
  };

  // Handle schedule session
  const handleScheduleSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSessionForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsScheduling(true);

    try {
      const response = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          date: sessionForm.date,
          time: sessionForm.time,
          topic: sessionForm.topic,
          createdBy: user?.name || user?.email.split('@')[0] || 'Unknown',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const newSession: StudySession = {
          id: data.sessionId,
          date: sessionForm.date,
          time: sessionForm.time,
          topic: sessionForm.topic,
          createdBy: user?.name || user?.email.split('@')[0] || 'Unknown',
          createdAt: new Date().toISOString(),
        };

        const updatedSessions = [...studySessions, newSession].sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateA.getTime() - dateB.getTime();
        });

        setStudySessions(updatedSessions);
        localStorage.setItem(`group_sessions_${groupId}`, JSON.stringify(updatedSessions));

        toast.success('Session scheduled! 📅', {
          icon: '✅',
          duration: 2000,
        });

        // Reset form
        setSessionForm({
          date: '',
          time: '',
          topic: '',
        });
        setSessionErrors({
          date: '',
          time: '',
          topic: '',
        });
      } else {
        throw new Error(data.error || 'Failed to schedule session');
      }
    } catch (error) {
      console.error('Schedule error:', error);
      toast.error('Failed to schedule session. Please try again.');
    } finally {
      setIsScheduling(false);
    }
  };

  // Format session date/time for display
  const formatSessionDateTime = (date: string, time: string): string => {
    const sessionDate = new Date(`${date}T${time}`);
    const dateStr = sessionDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = sessionDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${dateStr} at ${timeStr}`;
  };

  // Handle RSVP
  const handleRsvp = async (sessionId: string, rsvpStatus: 'going' | 'maybe' | 'not-going') => {
    try {
      const userId = user?.email || 'anonymous';
      
      const response = await fetch('/api/sessions/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId,
          rsvp: rsvpStatus,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update session with new RSVP data
        const updatedSessions = studySessions.map(session => {
          if (session.id === sessionId) {
            return {
              ...session,
              userRsvp: rsvpStatus,
              attendees: data.attendees,
            };
          }
          return session;
        });

        setStudySessions(updatedSessions);
        localStorage.setItem(`group_sessions_${groupId}`, JSON.stringify(updatedSessions));

        const statusEmoji = rsvpStatus === 'going' ? '✅' : rsvpStatus === 'maybe' ? '🤔' : '❌';
        toast.success(`RSVP updated! ${statusEmoji}`, {
          duration: 2000,
        });
      } else {
        throw new Error(data.error || 'Failed to update RSVP');
      }
    } catch (error) {
      console.error('RSVP error:', error);
      toast.error('Failed to update RSVP. Please try again.');
    }
  };

  // Filter connections based on search and exclude existing members
  const filteredConnections = mockConnections.filter((connection) => {
    const matchesSearch = connection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         connection.email.toLowerCase().includes(searchQuery.toLowerCase());
    const notMember = !group?.members.includes(connection.email);
    return matchesSearch && notMember;
  });

  // Toggle user selection
  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Handle send invites
  const handleSendInvites = async () => {
    if (selectedUserIds.length === 0) return;

    setIsSendingInvites(true);

    try {
      const response = await fetch('/api/groups/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId,
          userIds: selectedUserIds,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`Invites sent to ${selectedUserIds.length} ${selectedUserIds.length === 1 ? 'person' : 'people'}! 🎉`, {
          icon: '📨',
          duration: 3000,
        });
        setShowInviteModal(false);
        setSelectedUserIds([]);
        setSearchQuery('');
      } else {
        throw new Error(data.error || 'Failed to send invites');
      }
    } catch (error) {
      console.error('Send invites error:', error);
      toast.error('Failed to send invites. Please try again.');
    } finally {
      setIsSendingInvites(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <AnimatedPage>
        <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-white border-t-transparent rounded-full"
          />
        </div>
      </AnimatedPage>
    );
  }

  if (!group) {
    return (
      <AnimatedPage>
        <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Group Not Found</h2>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl border border-white/30 transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  const isCreator = user?.email === group.creator;

  return (
    <AnimatedPage>
      <main className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header with Back Button and Notification Bell */}
          <div className="flex items-center justify-between mb-6">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg border border-white/30 transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </motion.button>

            {/* Notification Bell - Always visible for reminders */}
            {studySessions.length > 0 && (
              <div className="relative" ref={notificationRef}>
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative"
                >
                  <motion.div
                    animate={hasNewReminder ? { rotate: [0, 15, -15, 15, -15, 0] } : {}}
                    transition={{ 
                      duration: 0.6,
                      repeat: hasNewReminder ? Infinity : 0,
                      repeatDelay: 2
                    }}
                    className={`p-3 backdrop-blur-xl rounded-full border transition-all cursor-pointer ${
                      hasNewReminder 
                        ? 'bg-yellow-500/30 border-yellow-400/50' 
                        : 'bg-white/20 border-white/30 hover:bg-white/30'
                    }`}
                    title={`${studySessions.length} session${studySessions.length > 1 ? 's' : ''} scheduled`}
                  >
                    <Bell className={`w-6 h-6 ${hasNewReminder ? 'text-yellow-300' : 'text-white/70'}`} />
                  </motion.div>
                  
                  {/* Unread notification count badge */}
                  {notifications.filter(n => !n.read).length > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-gradient-to-r from-red-600 to-red-500 rounded-full border-2 border-white flex items-center justify-center px-1"
                    >
                      <span className="text-white text-xs font-bold">
                        {notifications.filter(n => !n.read).length}
                      </span>
                    </motion.div>
                  )}
                  
                  {/* Pulsing dot when reminder is active */}
                  {hasNewReminder && (
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"
                    />
                  )}
                </motion.button>

                {/* Notification Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl z-50"
                    >
                      {/* Header */}
                      <div className="sticky top-0 backdrop-blur-xl bg-white/10 border-b border-white/20 p-4 flex items-center justify-between">
                        <h3 className="text-white font-bold text-lg">Notifications</h3>
                        {notifications.length > 0 && (
                          <button
                            onClick={() => {
                              setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                            }}
                            className="text-purple-300 hover:text-purple-200 text-sm font-medium transition-colors"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      {/* Notifications List */}
                      <div className="p-2">
                        {notifications.length > 0 ? (
                          notifications.map((notification, index) => (
                            <motion.div
                              key={notification.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              onClick={() => {
                                setNotifications(prev => 
                                  prev.map(n => 
                                    n.id === notification.id ? { ...n, read: true } : n
                                  )
                                );
                              }}
                              className={`p-3 rounded-xl mb-2 cursor-pointer transition-all ${
                                notification.read 
                                  ? 'bg-white/5 hover:bg-white/10' 
                                  : 'bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${
                                  notification.read ? 'bg-white/10' : 'bg-purple-500/30'
                                }`}>
                                  <Bell className={`w-4 h-4 ${
                                    notification.read ? 'text-white/50' : 'text-purple-300'
                                  }`} />
                                </div>
                                <div className="flex-1">
                                  <p className={`text-sm ${
                                    notification.read ? 'text-white/70' : 'text-white font-medium'
                                  }`}>
                                    {notification.message}
                                  </p>
                                  <p className="text-white/50 text-xs mt-1">
                                    {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                                  </p>
                                </div>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-1" />
                                )}
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-12"
                          >
                            <motion.div
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <Bell className="w-12 h-12 text-white/30 mx-auto mb-3" />
                            </motion.div>
                            <p className="text-white/70 text-sm font-medium">No notifications yet</p>
                            <p className="text-white/50 text-xs mt-1">
                              You&apos;ll see reminders here when sessions are coming up
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Group Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 mb-6"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {group.name}
                  </h1>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-purple-500/30 text-purple-200 rounded-full text-sm font-medium">
                      {group.subject}
                    </span>
                    <span className="flex items-center gap-1 text-white/80 text-sm">
                      {group.privacy === 'public' ? (
                        <>
                          <Globe className="w-4 h-4" />
                          Public
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Private
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {isCreator && (
                <span className="px-3 py-1 bg-yellow-500/30 text-yellow-200 rounded-full text-sm font-medium">
                  Creator
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-white/70 text-sm">
              <Calendar className="w-4 h-4" />
              Created on {formatDate(group.createdAt)}
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"
          >
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm mb-1">Members</p>
                  <p className="text-3xl font-bold text-white">{group.members.length}</p>
                </div>
                <Users className="w-10 h-10 text-white/50" />
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm mb-1">Messages</p>
                  <p className="text-3xl font-bold text-white">0</p>
                </div>
                <MessageSquare className="w-10 h-10 text-white/50" />
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm mb-1">Study Sessions</p>
                  <p className="text-3xl font-bold text-white">0</p>
                </div>
                <Calendar className="w-10 h-10 text-white/50" />
              </div>
            </div>
          </motion.div>

          {/* Members List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Users className="w-6 h-6" />
                Members ({group.members.length})
              </h2>
              {isCreator && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowInviteModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transition-all flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Invite Members
                </motion.button>
              )}
            </div>

            <div className="space-y-3">
              {group.members.map((memberEmail, index) => {
                const initials = memberEmail.charAt(0).toUpperCase();
                const isCurrentUser = memberEmail === user?.email;
                const isMemberCreator = memberEmail === group.creator;

                return (
                  <motion.div
                    key={memberEmail}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-white/10 rounded-xl border border-white/20 hover:bg-white/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {initials}
                      </div>
                      <div>
                        <p className="text-white font-semibold">
                          {memberEmail.split('@')[0]}
                          {isCurrentUser && <span className="text-blue-300 ml-2">(You)</span>}
                        </p>
                        <p className="text-white/60 text-sm">{memberEmail}</p>
                      </div>
                    </div>
                    {isMemberCreator && (
                      <span className="px-3 py-1 bg-yellow-500/30 text-yellow-200 rounded-full text-xs font-medium">
                        Creator
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Group Chat Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col h-[600px]"
          >
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-xl p-4 border-b border-white/20">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-white" />
                <div>
                  <h2 className="text-xl font-bold text-white">Group Chat: {group.name}</h2>
                  <p className="text-white/80 text-sm">{group.members.length} members</p>
                </div>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.length > 0 ? (
                <AnimatePresence mode="popLayout">
                  {chatMessages.map((message, index) => {
                    const isCurrentUser = message.sender === user?.name || message.sender === user?.email.split('@')[0];
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: index * 0.05,
                          type: 'spring',
                          stiffness: 500,
                          damping: 30,
                        }}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-md ${
                            isCurrentUser
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-sm'
                              : 'bg-white/80 backdrop-blur-sm text-gray-800 rounded-bl-sm'
                          }`}
                        >
                          {!isCurrentUser && (
                            <p className={`text-xs font-bold mb-1 ${getSenderColor(message.sender)}`}>
                              {message.sender}
                            </p>
                          )}
                          <p className="text-sm leading-relaxed">{message.text}</p>
                          <div
                            className={`flex items-center gap-1 mt-1 text-xs ${
                              isCurrentUser ? 'text-white/70 justify-end' : 'text-gray-500'
                            }`}
                          >
                            <span>
                              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              ) : (
                // Empty state
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center justify-center h-full"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <MessageSquare className="w-16 h-16 text-white/40 mb-4" />
                  </motion.div>
                  <h3 className="text-white font-bold text-lg mb-2">Start the conversation!</h3>
                  <p className="text-white/70 text-sm">Be the first to send a message</p>
                </motion.div>
              )}
              <div ref={chatEndRef} />
              <div ref={chatMessagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 bg-white/40 backdrop-blur-xl border-t border-white/20"
            >
              <div className="flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 rounded-xl bg-white/80 backdrop-blur-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 placeholder-gray-400"
                  disabled={isSendingMessage}
                />
                <motion.button
                  type="submit"
                  disabled={!chatInput.trim() || isSendingMessage}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send
                </motion.button>
              </div>
            </form>
          </motion.div>

          {/* File Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6 backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-white" />
                <div>
                  <h2 className="text-2xl font-bold text-white">Shared Files</h2>
                  <p className="text-white/80 text-sm">Upload and share study materials</p>
                </div>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-5 h-5" />
                  {isUploading ? 'Uploading...' : 'Upload File'}
                </motion.button>
              </div>
            </div>

            {/* Upload Progress Bar */}
            {isUploading && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-medium">Uploading...</span>
                  <span className="text-white text-sm font-medium">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                  />
                </div>
              </motion.div>
            )}

            {/* Files List */}
            {uploadedFiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uploadedFiles.map((file, index) => {
                  const FileIcon = getFileIcon(file.type);
                  const isImage = file.type.startsWith('image/');

                  return (
                    <motion.div
                      key={file.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        delay: index * 0.1,
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                      }}
                      className="backdrop-blur-xl bg-white/10 rounded-xl border border-white/20 p-4 hover:bg-white/20 transition-colors"
                    >
                      {/* Image Preview */}
                      {isImage && (
                        <div className="mb-3 rounded-lg overflow-hidden bg-white/5">
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full max-h-40 object-contain"
                          />
                        </div>
                      )}

                      {/* File Info */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate mb-1">
                            {file.name}
                          </p>
                          <div className="flex items-center gap-2 text-white/60 text-xs">
                            <span>{formatFileSize(file.size)}</span>
                            <span>•</span>
                            <span>{file.uploadedBy}</span>
                          </div>
                          <p className="text-white/50 text-xs mt-1">
                            {formatDistanceToNow(new Date(file.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                        <a
                          href={file.url}
                          download={file.name}
                          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download className="w-5 h-5 text-white" />
                        </a>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              // Empty State
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <FileText className="w-16 h-16 text-white/40 mb-4" />
                </motion.div>
                <h3 className="text-white font-bold text-lg mb-2">Share your notes here</h3>
                <p className="text-white/70 text-sm mb-4">Upload PDFs, images, or text files to share with the group</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Upload Your First File
                </motion.button>
                <p className="text-white/50 text-xs mt-3">Max file size: 5MB • PDF, JPG, PNG, TXT</p>
              </motion.div>
            )}
          </motion.div>

          {/* Study Sessions Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-6 backdrop-blur-xl bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-blue-600/20 rounded-2xl border border-white/20 shadow-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-600/40 to-pink-600/40 rounded-xl">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl">Schedule Study Sessions</h3>
                  <p className="text-white/70 text-sm">Organize group study times</p>
                </div>
              </div>
              
              {/* Test Reminder Button (DEV ONLY) */}
              {process.env.NODE_ENV === 'development' && studySessions.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    // Add test notification
                    const testSession = studySessions[0];
                    const testNotification = {
                      id: `notif_${Date.now()}`,
                      message: `Test notification: Session "${testSession.topic}" starts soon at ${testSession.time}`,
                      timestamp: new Date().toISOString(),
                      read: false,
                      sessionId: testSession.id,
                    };
                    setNotifications(prev => [testNotification, ...prev]);
                    
                    setHasNewReminder(true);
                    toast('📧 Email reminder: Session starts soon!', {
                      duration: 5000,
                      icon: '🔔',
                    });
                    toast.success('Reminder sent to all attendees! 🔔', {
                      duration: 3000,
                    });
                    setTimeout(() => setHasNewReminder(false), 5000);
                  }}
                  className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-400/30 text-yellow-200 text-sm font-medium rounded-lg transition-all flex items-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  Test Reminder
                </motion.button>
              )}
            </div>

            {/* Scheduling Form */}
            <div className="mb-6 p-5 bg-white/5 rounded-xl border border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Date Input */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={sessionForm.date}
                    onChange={(e) => setSessionForm({...sessionForm, date: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                  {sessionErrors.date && (
                    <p className="text-red-400 text-xs mt-1">{sessionErrors.date}</p>
                  )}
                </div>

                {/* Time Input */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="time"
                    value={sessionForm.time}
                    onChange={(e) => setSessionForm({...sessionForm, time: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                  {sessionErrors.time && (
                    <p className="text-red-400 text-xs mt-1">{sessionErrors.time}</p>
                  )}
                </div>
              </div>

              {/* Topic Input */}
              <div className="mb-4">
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Topic <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={sessionForm.topic}
                  onChange={(e) => setSessionForm({...sessionForm, topic: e.target.value})}
                  placeholder="What will you study? (min. 5 characters)"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
                {sessionErrors.topic && (
                  <p className="text-red-400 text-xs mt-1">{sessionErrors.topic}</p>
                )}
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleScheduleSession}
                disabled={isScheduling}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isScheduling ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="w-5 h-5" />
                    Schedule Session
                  </>
                )}
              </motion.button>
            </div>

            {/* Sessions List */}
            {studySessions.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-white font-semibold text-sm mb-3">Upcoming Sessions</h4>
                <AnimatePresence>
                  {studySessions.map((session, index) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <h5 className="text-white font-semibold mb-1">{session.topic}</h5>
                          <div className="flex items-center gap-2 text-white/60 text-sm">
                            <Calendar className="w-4 h-4" />
                            <span>{formatSessionDateTime(session.date, session.time)}</span>
                          </div>
                          <p className="text-white/50 text-xs mt-2">
                            Created by {session.createdBy} • {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="px-3 py-1 bg-purple-600/30 rounded-lg">
                          <span className="text-purple-200 text-xs font-medium">{session.time}</span>
                        </div>
                      </div>

                      {/* RSVP Section */}
                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
                        {/* RSVP Buttons */}
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRsvp(session.id, 'going')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              session.userRsvp === 'going'
                                ? 'bg-green-500 text-white'
                                : 'bg-white/10 text-white/70 hover:bg-white/20'
                            }`}
                          >
                            ✓ Going
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRsvp(session.id, 'maybe')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              session.userRsvp === 'maybe'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-white/10 text-white/70 hover:bg-white/20'
                            }`}
                          >
                            ? Maybe
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRsvp(session.id, 'not-going')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              session.userRsvp === 'not-going'
                                ? 'bg-red-500 text-white'
                                : 'bg-white/10 text-white/70 hover:bg-white/20'
                            }`}
                          >
                            ✗ Not Going
                          </motion.button>
                        </div>

                        {/* Attendee Count */}
                        <div className="flex items-center gap-2">
                          {session.attendees && (
                            <>
                              {session.attendees.going > 0 && (
                                <motion.div
                                  key={`going-${session.attendees.going}`}
                                  initial={{ scale: 1.2 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                                  className="px-2 py-1 bg-green-500/20 rounded-lg flex items-center gap-1"
                                >
                                  <Users className="w-3 h-3 text-green-400" />
                                  <span className="text-green-300 text-xs font-medium">
                                    {session.attendees.going} Going
                                  </span>
                                </motion.div>
                              )}
                              {session.attendees.maybe > 0 && (
                                <motion.div
                                  key={`maybe-${session.attendees.maybe}`}
                                  initial={{ scale: 1.2 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                                  className="px-2 py-1 bg-yellow-500/20 rounded-lg flex items-center gap-1"
                                >
                                  <span className="text-yellow-300 text-xs font-medium">
                                    {session.attendees.maybe} Maybe
                                  </span>
                                </motion.div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-8"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-block mb-4"
                >
                  <Calendar className="w-16 h-16 text-white/30" />
                </motion.div>
                <h3 className="text-white font-bold text-lg mb-2">No sessions scheduled</h3>
                <p className="text-white/70 text-sm">Schedule your first study session above!</p>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Invite Modal */}
        <AnimatePresence>
          {showInviteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowInviteModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 max-h-[80vh] overflow-hidden flex flex-col"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                      <UserPlus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Invite Members</h2>
                      <p className="text-white/70 text-sm">Select buddies to invite to {group.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                    />
                  </div>
                </div>

                {/* Connections List */}
                <div className="flex-1 overflow-y-auto mb-6 space-y-3">
                  {filteredConnections.length > 0 ? (
                    filteredConnections.map((connection, index) => {
                      const isSelected = selectedUserIds.includes(connection.id);
                      return (
                        <motion.label
                          key={connection.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-500/30 border-2 border-blue-400 shadow-lg shadow-blue-500/20'
                              : 'bg-white/10 border-2 border-transparent hover:bg-white/20'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleUserSelection(connection.id)}
                            className="w-5 h-5 rounded cursor-pointer accent-blue-500"
                          />
                          <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
                            {connection.avatar}
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-semibold">{connection.name}</p>
                            <p className="text-white/60 text-sm">{connection.email}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {connection.subjects.map((subject) => (
                                <span
                                  key={subject}
                                  className="px-2 py-0.5 bg-purple-500/30 text-purple-200 rounded text-xs"
                                >
                                  {subject}
                                </span>
                              ))}
                            </div>
                          </div>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center"
                            >
                              <UserPlus className="w-5 h-5 text-white" />
                            </motion.div>
                          )}
                        </motion.label>
                      );
                    })
                  ) : mockConnections.length === 0 ? (
                    // Empty state - no connections at all
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-white/40 mx-auto mb-4" />
                      <h3 className="text-white font-bold text-lg mb-2">No Connections Yet</h3>
                      <p className="text-white/70 text-sm mb-4">
                        Find study buddies to invite to your group
                      </p>
                      <Link
                        href="/search"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all"
                      >
                        <Search className="w-5 h-5" />
                        Find Buddies
                      </Link>
                    </div>
                  ) : (
                    // No search results
                    <div className="text-center py-12">
                      <Search className="w-16 h-16 text-white/40 mx-auto mb-4" />
                      <h3 className="text-white font-bold text-lg mb-2">No Results Found</h3>
                      <p className="text-white/70 text-sm">
                        Try searching with a different name or email
                      </p>
                    </div>
                  )}
                </div>

                {/* Selected Count */}
                {selectedUserIds.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 px-4 py-2 bg-blue-500/20 rounded-lg border border-blue-400/30"
                  >
                    <p className="text-white text-sm font-medium">
                      {selectedUserIds.length} {selectedUserIds.length === 1 ? 'person' : 'people'} selected
                    </p>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    disabled={isSendingInvites}
                    className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <motion.button
                    onClick={handleSendInvites}
                    disabled={selectedUserIds.length === 0 || isSendingInvites}
                    animate={
                      selectedUserIds.length === 0
                        ? { scale: [1, 1.02, 1], opacity: [1, 0.8, 1] }
                        : {}
                    }
                    transition={{
                      repeat: selectedUserIds.length === 0 ? Infinity : 0,
                      duration: 2,
                    }}
                    whileHover={{ scale: selectedUserIds.length > 0 && !isSendingInvites ? 1.02 : 1 }}
                    whileTap={{ scale: selectedUserIds.length > 0 && !isSendingInvites ? 0.98 : 1 }}
                    className={`flex-1 px-6 py-3 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                      selectedUserIds.length === 0
                        ? 'bg-gray-500/50 text-white/50 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                    }`}
                  >
                    {isSendingInvites ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                        Sending...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        Send Invites
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </AnimatedPage>
  );
}
