"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AnimatedPage from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import { FileText, Upload, Copy, Check, ArrowLeft, Save, X, Download, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface SavedSummary {
  id: number;
  fileName: string;
  summary: string;
  timestamp: string;
}

export default function DocumentSummarizerPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [isUploading, setIsUploading] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [summaryFileName, setSummaryFileName] = useState<string>("");
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [savedSummaries, setSavedSummaries] = useState<SavedSummary[]>([]);
  const [showSavedSummaries, setShowSavedSummaries] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  // Load saved summaries
  useEffect(() => {
    const saved = localStorage.getItem('my_summaries');
    if (saved) {
      setSavedSummaries(JSON.parse(saved));
    }
  }, []);

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const allowedTypes = ['.pdf', '.txt', '.docx'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      toast.error('Unsupported file format. Please upload PDF, TXT, or DOCX files');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setSummary('');
    setSummaryFileName(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.summary) {
        setSummary(data.summary);
        toast.success('Document summarized successfully!');
        
        // Update document summarize count for badges
        const docCount = parseInt(localStorage.getItem('docSummarizeCount') || '0') + 1;
        localStorage.setItem('docSummarizeCount', docCount.toString());
      } else {
        throw new Error(data.error || 'Failed to summarize document');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to summarize document');
      setSummary('');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopiedSummary(true);
      toast.success('Summary copied to clipboard!');
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleSaveSummary = () => {
    try {
      const newSummary: SavedSummary = {
        id: Date.now(),
        fileName: summaryFileName,
        summary: summary,
        timestamp: new Date().toISOString(),
      };
      const updated = [newSummary, ...savedSummaries];
      localStorage.setItem('my_summaries', JSON.stringify(updated));
      setSavedSummaries(updated);
      toast.success('Summary saved!');
    } catch (error) {
      toast.error('Failed to save summary');
    }
  };

  const handleDeleteSummary = (id: number) => {
    const updated = savedSummaries.filter(s => s.id !== id);
    localStorage.setItem('my_summaries', JSON.stringify(updated));
    setSavedSummaries(updated);
    toast.success('Summary deleted');
  };

  const handleDownloadSummary = () => {
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary-${summaryFileName.replace(/\.[^/.]+$/, '')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Summary downloaded!');
  };

  if (!isAuthenticated) {
    return null;
  }

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
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl">
                  <FileText className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white">Document Summarizer</h1>
                  <p className="text-gray-400">Upload documents to get AI-powered summaries</p>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSavedSummaries(!showSavedSummaries)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              >
                <Save className="w-4 h-4" />
                Saved ({savedSummaries.length})
              </motion.button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8"
            >
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-400" />
                Upload Document
              </h2>
              
              <div className="space-y-6">
                {/* File Drop Zone */}
                <label className="block cursor-pointer">
                  <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                    isUploading 
                      ? 'border-purple-500 bg-purple-500/10' 
                      : 'border-white/20 hover:border-purple-400 hover:bg-white/5'
                  }`}>
                    {isUploading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
                        <p className="text-white font-medium">Processing {summaryFileName}...</p>
                        <p className="text-gray-400 text-sm mt-2">This may take a moment</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-white font-medium mb-2">Drop your file here or click to browse</p>
                        <p className="text-gray-400 text-sm">Supports PDF, TXT, DOCX (max 5MB)</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.docx"
                    onChange={handleDocumentUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>

                {/* File Info */}
                {summaryFileName && !isUploading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-purple-400" />
                      <span className="text-white truncate">{summaryFileName}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSummary('');
                        setSummaryFileName('');
                      }}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Summary Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-pink-400" />
                  Summary
                </h2>
                
                {summary && (
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCopySummary}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      title="Copy summary"
                    >
                      {copiedSummary ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSaveSummary}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      title="Save summary"
                    >
                      <Save className="w-4 h-4 text-gray-400" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDownloadSummary}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      title="Download summary"
                    >
                      <Download className="w-4 h-4 text-gray-400" />
                    </motion.button>
                  </div>
                )}
              </div>

              <div className="min-h-[300px] max-h-[500px] overflow-y-auto">
                {summary ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{summary}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <FileText className="w-16 h-16 text-gray-600 mb-4" />
                    <p className="text-gray-400">Upload a document to see its AI-generated summary here</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Saved Summaries Modal */}
          {showSavedSummaries && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowSavedSummaries(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900 rounded-2xl border border-white/20 p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Saved Summaries</h2>
                  <button
                    onClick={() => setShowSavedSummaries(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {savedSummaries.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No saved summaries yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedSummaries.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white/5 rounded-xl p-4 border border-white/10"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-medium">{item.fileName}</h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSummary(item.summary);
                                setSummaryFileName(item.fileName);
                                setShowSavedSummaries(false);
                              }}
                              className="text-sm text-blue-400 hover:text-blue-300"
                            >
                              Load
                            </button>
                            <button
                              onClick={() => handleDeleteSummary(item.id)}
                              className="text-sm text-red-400 hover:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-400 text-sm line-clamp-2">{item.summary}</p>
                        <p className="text-gray-500 text-xs mt-2">
                          {new Date(item.timestamp).toLocaleString()}
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
