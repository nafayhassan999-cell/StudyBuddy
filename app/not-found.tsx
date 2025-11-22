'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-12 text-center"
      >
        <motion.h1
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="text-9xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4"
        >
          404
        </motion.h1>

        <h2 className="text-3xl font-bold text-white mb-4">
          Page Not Found
        </h2>
        
        <p className="text-white/70 mb-8 text-lg">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or deleted.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg flex items-center gap-2"
            >
              <Home className="w-5 h-5" />
              Go Home
            </motion.button>
          </Link>

          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-white/20 text-white rounded-xl font-semibold shadow-lg flex items-center gap-2 hover:bg-white/30 transition"
            >
              <Search className="w-5 h-5" />
              Dashboard
            </motion.button>
          </Link>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold shadow-lg flex items-center gap-2 hover:bg-white/20 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
