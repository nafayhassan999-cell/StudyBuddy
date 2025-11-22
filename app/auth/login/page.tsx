"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import AnimatedPage from "@/components/AnimatedPage";
import AuthSetupBanner from "@/components/AuthSetupBanner";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import party from "party-js";

export default function LoginPage() {
  const { login, loginWithGoogle, loginWithMagicLink, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  // Handle NextAuth errors
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      toast.error("Authentication failed. Please try again.", { icon: "❌" });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let success = false;
      
      if (useMagicLink) {
        success = await loginWithMagicLink(email);
      } else {
        success = await login(email, password);
      }
      
      if (success) {
        if (!useMagicLink) {
          // Trigger confetti
          party.confetti(document.body, {
            count: party.variation.range(60, 100),
            spread: party.variation.range(40, 80),
          });
          
          toast.success("Login successful! Redirecting...", {
            icon: "🎉",
            duration: 2000,
          });
          
          setTimeout(() => {
            router.push("/dashboard");
          }, 1500);
        }
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.", {
        icon: "❌",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    await loginWithGoogle();
  };

  return (
    <AnimatedPage>
      <AuthSetupBanner />
      {/* Animated gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <main className="relative min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="w-full max-w-md"
        >
          {/* Frosted glass card */}
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/30 relative overflow-hidden">
            {/* Decorative sparkles */}
            <div className="absolute top-6 right-6">
              <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
            </div>

            <div className="text-center mb-10">
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-bold text-white mb-3"
              >
                Welcome Back
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/90 text-lg"
              >
                Log in to continue your learning journey
              </motion.p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input with Floating Label */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="relative"
              >
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="peer w-full px-4 py-3 rounded-xl bg-white/40 border-2 border-white/50 text-gray-800 placeholder-transparent focus:outline-none focus:ring-4 focus:ring-purple-300/50 focus:border-purple-400 transition-all"
                  placeholder="you@example.com"
                />
                <label
                  htmlFor="email"
                  className="absolute -top-3 left-3 text-xs text-purple-600 font-semibold bg-white px-2 rounded transition-all duration-200 
                           peer-placeholder-shown:top-3 peer-placeholder-shown:left-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:bg-transparent
                           peer-focus:-top-3 peer-focus:left-3 peer-focus:text-xs peer-focus:text-purple-600 peer-focus:bg-white"
                >
                  Email Address
                </label>
              </motion.div>

              {/* Magic Link Toggle */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="flex items-center justify-between"
              >
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={useMagicLink}
                    onChange={(e) => setUseMagicLink(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-white/30 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  <span className="ms-3 text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                    Use Magic Link 🪄
                  </span>
                </label>
              </motion.div>

              {/* Password Input with Floating Label and Eye Toggle (conditional) */}
              {!useMagicLink && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="relative"
                >
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!useMagicLink}
                    className="peer w-full px-4 py-3 pr-12 rounded-xl bg-white/40 border-2 border-white/50 text-gray-800 placeholder-transparent focus:outline-none focus:ring-4 focus:ring-purple-300/50 focus:border-purple-400 transition-all"
                    placeholder="••••••••"
                  />
                  <label
                    htmlFor="password"
                    className="absolute -top-3 left-3 text-xs text-purple-600 font-semibold bg-white px-2 rounded transition-all duration-200 
                           peer-placeholder-shown:top-3 peer-placeholder-shown:left-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:bg-transparent
                           peer-focus:-top-3 peer-focus:left-3 peer-focus:text-xs peer-focus:text-purple-600 peer-focus:bg-white"
                  >
                    Password
                  </label>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-purple-600 transition-all duration-200"
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </motion.div>
                  </motion.button>
                </motion.div>
              )}

              {/* Forgot Password Link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="text-right"
              >
                <button
                  type="button"
                  onClick={() => toast.success("Password reset email sent! (Mock)", { icon: "📧" })}
                  className="relative text-white/90 hover:text-white text-sm font-medium group inline-block"
                >
                  <span className="relative">
                    Forgot Password?
                    <span className="absolute left-0 -bottom-1 w-full h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                  </span>
                </button>
              </motion.div>

              {/* Submit Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={isLoading}
                className="w-full px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >              {
                  isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {useMagicLink ? "Sending magic link..." : "Logging in..."}
                  </span>
                ) : (
                  useMagicLink ? "Send Magic Link" : "Login"
                )}
              </motion.button>

              {/* Divider */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
                className="relative flex items-center"
              >
                <div className="flex-grow border-t border-white/30"></div>
                <span className="flex-shrink mx-4 text-white/70 text-sm">or</span>
                <div className="flex-grow border-t border-white/30"></div>
              </motion.div>

              {/* Google Sign In */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleGoogleLogin}
                className="w-full px-8 py-3 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-lg rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </motion.button>
            </form>

            {/* Footer with Animated Link */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75 }}
              className="mt-8 text-center"
            >
              <p className="text-white">
                No account?{" "}
                <Link 
                  href="/auth/signup" 
                  className="relative text-white font-bold inline-block group"
                >
                  <span className="relative">
                    Signup
                    <span className="absolute left-0 -bottom-1 w-full h-0.5 bg-gradient-to-r from-gray-600 to-gray-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                  </span>
                </Link>
              </p>
            </motion.div>

            {/* Back to Home Link */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 text-center"
            >
              <Link
                href="/"
                className="inline-flex items-center text-white/80 hover:text-white transition-colors text-sm font-medium"
              >
                ← Back to home
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </AnimatedPage>
  );
}
