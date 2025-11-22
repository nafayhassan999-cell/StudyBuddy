'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle, Home } from 'lucide-react'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-12 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-6"
        >
          <CheckCircle className="w-12 h-12 text-green-400" />
        </motion.div>

        <h1 className="text-4xl font-bold text-white mb-4">
          Test Page
        </h1>
        
        <p className="text-white/70 mb-2">
          ✅ Routing is working correctly!
        </p>
        <p className="text-white/70 mb-8">
          This test page confirms that Next.js navigation and routing are functioning properly.
        </p>

        <Link href="/dashboard">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg flex items-center gap-2 mx-auto"
          >
            <Home className="w-5 h-5" />
            Back to Dashboard
          </motion.button>
        </Link>

        <div className="mt-8 p-4 bg-white/5 rounded-xl text-left">
          <p className="text-white/60 text-sm mb-2">Debug Info:</p>
          <code className="text-green-400 text-xs">
            pathname: /test<br/>
            timestamp: {new Date().toISOString()}<br/>
            status: SUCCESS
          </code>
        </div>
      </motion.div>
    </div>
  )
}
