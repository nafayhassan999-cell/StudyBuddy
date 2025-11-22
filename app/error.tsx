'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-red-500/20 rounded-full mb-6"
        >
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </motion.div>

        <h1 className="text-3xl font-bold text-white mb-4">
          Oops! Something went wrong
        </h1>
        
        <p className="text-white/70 mb-8">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>

        <div className="flex gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={reset}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </motion.button>

          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-white/20 text-white rounded-xl font-semibold shadow-lg flex items-center gap-2 hover:bg-white/30 transition"
            >
              <Home className="w-5 h-5" />
              Go Home
            </motion.button>
          </Link>
        </div>

        {error.digest && (
          <p className="text-white/40 text-xs mt-6">
            Error ID: {error.digest}
          </p>
        )}
      </motion.div>
    </div>
  )
}
