"use client";

import { motion, useInView } from "framer-motion";
import { Users, Bot, BookOpen, Brain } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";

const heroVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0 },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.5,
    },
  },
};

const features = [
  {
    icon: Users,
    title: "Smart Matching",
    description: "Connect with study buddies who share your courses, learning style, and schedule for optimal collaboration.",
  },
  {
    icon: Bot,
    title: "AI Tutor",
    description: "Get instant help from our Gemini-powered AI tutor, available 24/7 to answer questions and explain concepts.",
  },
  {
    icon: BookOpen,
    title: "Group Study",
    description: "Create or join study groups, share resources, and collaborate on projects with your peers seamlessly.",
  },
];

export default function Home() {
  const featuresRef = useRef(null);
  const isInView = useInView(featuresRef, { once: true, margin: "-100px" });

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 overflow-hidden">
        {/* Floating Icon */}
        <motion.div
          className="absolute top-20 right-10 md:right-20 text-white/20"
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Brain className="w-24 h-24 md:w-32 md:h-32" />
        </motion.div>

        <motion.div
          className="absolute bottom-20 left-10 md:left-20 text-white/20"
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5,
          }}
        >
          <BookOpen className="w-20 h-20 md:w-28 md:h-28" />
        </motion.div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            <motion.h1
              variants={heroVariants}
              className="text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-tight"
            >
              Find Your Perfect Study Buddy & AI Tutor
            </motion.h1>

            <motion.p
              variants={heroVariants}
              className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-3xl mx-auto"
            >
              Elevate your learning experience with intelligent buddy matching and 24/7 AI-powered tutoring support.
            </motion.p>

            <motion.div
              variants={heroVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
            >
              <Link href="/auth/signup">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white text-blue-600 font-bold rounded-full hover:shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  Get Started
                </motion.button>
              </Link>

              <motion.button
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 backdrop-blur-md bg-white/10 border-2 border-white/50 text-white font-semibold rounded-full hover:shadow-xl hover:bg-white/20 hover:scale-105 transition-all duration-300"
              >
                Learn More
              </motion.button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          animate={{
            y: [0, 10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white rounded-full"></div>
          </div>
        </motion.div>
      </section>

      {/* Product Showcase Section with 16:9 Image */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold gradient-text mb-4">
              See StudyBuddy in Action
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Experience the power of AI-driven learning and collaborative study sessions.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative group"
          >
            {/* 16:9 Image Container */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 dark:border-gray-700/50 bg-gradient-to-br from-gray-600/20 via-gray-700/20 to-gray-800/20 backdrop-blur-xl">
              {/* Product Image */}
              <div className="relative w-full h-full bg-gray-900">
                <Image
                  src="/product-screenshot.png"
                  alt="StudyBuddy Product Screenshot - AI Tutor and Study Buddy Matching Platform"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1280px"
                />
              </div>

              {/* Overlay gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute top-6 right-6 px-4 py-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-full shadow-lg border border-white/30"
              >
                <span className="text-sm font-semibold bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-transparent">
                  ✨ AI-Powered
                </span>
              </motion.div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-purple-500/20 dark:bg-purple-500/10 rounded-full blur-2xl" />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold gradient-text mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Powerful features designed to enhance your learning journey and academic success.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={cardVariants}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                transition={{ delay: index * 0.2 }}
                whileHover={{ scale: 1.05, rotateY: 5 }}
                className="group bg-white/10 dark:bg-gray-800/30 backdrop-blur-lg rounded-xl shadow-md hover:shadow-xl p-8 transition-all duration-300 border border-white/20 cursor-pointer"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
