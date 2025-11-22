"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import AnimatedPage from "@/components/AnimatedPage";
import AuthSetupBanner from "@/components/AuthSetupBanner";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import party from "party-js";

type PasswordStrength = "weak" | "medium" | "strong";

export default function SignupPage() {
  const { signup, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

  // Password strength calculation
  const passwordStrength = useMemo((): { strength: PasswordStrength; width: string; color: string } => {
    if (password.length === 0) {
      return { strength: "weak", width: "0%", color: "bg-gray-300" };
    }
    
    if (password.length < 8) {
      return { strength: "weak", width: "33%", color: "bg-red-500" };
    }
    
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    
    if (password.length >= 12 && hasSpecialChar && hasNumber && hasUpperCase && hasLowerCase) {
      return { strength: "strong", width: "100%", color: "bg-green-500" };
    }
    
    if (password.length >= 8 && ((hasSpecialChar && hasNumber) || (hasUpperCase && hasLowerCase))) {
      return { strength: "medium", width: "66%", color: "bg-yellow-500" };
    }
    
    return { strength: "weak", width: "33%", color: "bg-red-500" };
  }, [password]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate password match
    if (password !== confirmPassword) {
      toast.error("Passwords do not match!", {
        icon: "⚠️",
      });
      return;
    }

    // Validate password strength
    if (passwordStrength.strength === "weak") {
      toast.error("Please choose a stronger password (at least 8 characters)", {
        icon: "🔒",
      });
      return;
    }

    setIsLoading(true);

    try {
      const success = await signup(name, email, password);
      
      if (success) {
        // Trigger confetti
        party.confetti(document.body, {
          count: party.variation.range(80, 120),
          spread: party.variation.range(50, 90),
        });
        
        // Don't redirect immediately if email confirmation is required
        // The AuthContext will show appropriate message
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error?.message || "An error occurred. Please try again.", {
        icon: "❌",
      });
    } finally {
      setIsLoading(false);
    }
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
                Create Account
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/90 text-lg"
              >
                Join StudyBuddy and start your learning journey
              </motion.p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Input with Floating Label */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="relative"
              >
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="peer w-full px-4 py-3 rounded-xl bg-white/40 border-2 border-white/50 text-gray-800 placeholder-transparent focus:outline-none focus:ring-4 focus:ring-purple-300/50 focus:border-purple-400 transition-all"
                  placeholder="John Doe"
                />
                <label
                  htmlFor="name"
                  className="absolute -top-3 left-3 text-xs text-purple-600 font-semibold bg-white px-2 rounded transition-all duration-200 
                           peer-placeholder-shown:top-3 peer-placeholder-shown:left-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:bg-transparent
                           peer-focus:-top-3 peer-focus:left-3 peer-focus:text-xs peer-focus:text-purple-600 peer-focus:bg-white"
                >
                  Full Name
                </label>
              </motion.div>

              {/* Email Input with Floating Label */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
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

              {/* Password Input with Floating Label and Eye Toggle */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="relative"
              >
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
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
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </motion.button>
              </motion.div>

              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white">Password Strength:</span>
                    <span className={`font-semibold capitalize ${
                      passwordStrength.strength === "weak" ? "text-red-400" :
                      passwordStrength.strength === "medium" ? "text-yellow-400" :
                      "text-green-400"
                    }`}>
                      {passwordStrength.strength}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: passwordStrength.width }}
                      transition={{ duration: 0.3 }}
                      className={`h-full ${passwordStrength.color} transition-colors duration-300`}
                    />
                  </div>
                  <p className="text-xs text-white/80">
                    {passwordStrength.strength === "weak" && "Use at least 8 characters with numbers & symbols"}
                    {passwordStrength.strength === "medium" && "Good! Try adding more variety"}
                    {passwordStrength.strength === "strong" && "Excellent password strength! 🔒"}
                  </p>
                </motion.div>
              )}

              {/* Confirm Password Input with Floating Label and Eye Toggle */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="relative"
              >
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="peer w-full px-4 py-3 pr-12 rounded-xl bg-white/40 border-2 border-white/50 text-gray-800 placeholder-transparent focus:outline-none focus:ring-4 focus:ring-purple-300/50 focus:border-purple-400 transition-all"
                  placeholder="••••••••"
                />
                <label
                  htmlFor="confirmPassword"
                  className="absolute -top-3 left-3 text-xs text-purple-600 font-semibold bg-white px-2 rounded transition-all duration-200 
                           peer-placeholder-shown:top-3 peer-placeholder-shown:left-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:bg-transparent
                           peer-focus:-top-3 peer-focus:left-3 peer-focus:text-xs peer-focus:text-purple-600 peer-focus:bg-white"
                >
                  Confirm Password
                </label>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-purple-600 transition-all duration-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </motion.button>
              </motion.div>

              {/* Password Mismatch Warning */}
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-sm text-red-300 flex items-center"
                >
                  ⚠️ Passwords do not match
                </motion.p>
              )}

              {/* Submit Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={isLoading}
                className="w-full px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  "Sign Up"
                )}
              </motion.button>
            </form>

            {/* Footer with Animated Link */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-8 text-center"
            >
              <p className="text-white">
                Already have an account?{" "}
                <Link 
                  href="/auth/login" 
                  className="relative text-white font-bold inline-block group"
                >
                  <span className="relative">
                    Login
                    <span className="absolute left-0 -bottom-1 w-full h-0.5 bg-gradient-to-r from-gray-600 to-gray-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                  </span>
                </Link>
              </p>
            </motion.div>

            {/* Back to Home Link */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
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
