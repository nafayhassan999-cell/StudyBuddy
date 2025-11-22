"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function SupabaseTestPage() {
  const [status, setStatus] = useState<"testing" | "success" | "error">("testing");
  const [message, setMessage] = useState("Testing Supabase connection...");
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    testSupabaseConnection();
  }, []);

  async function testSupabaseConnection() {
    try {
      // Test 1: Check if Supabase client is initialized
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      // Test 2: Try to get session (will be null if not logged in, but should not error)
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }

      // Test 3: Try to query a table (this will test database connection)
      // Since tables might not exist yet, we'll just test the connection
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      // If we get here without errors, connection is working!
      setStatus("success");
      setMessage("✅ Supabase connection successful!");
      setDetails({
        projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSession: !!sessionData.session,
        databaseStatus: error ? "Tables not created yet (run schema.sql)" : "✅ Database connected",
      });

    } catch (error: any) {
      setStatus("error");
      setMessage("❌ Supabase connection failed");
      setDetails({
        error: error.message,
        projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hint: "Check that your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are correct in .env.local"
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
        <h1 className="text-4xl font-bold text-white mb-6 text-center">
          Supabase Connection Test
        </h1>

        <div className={`p-6 rounded-xl mb-6 ${
          status === "testing" ? "bg-blue-500/20 border-blue-500/50" :
          status === "success" ? "bg-green-500/20 border-green-500/50" :
          "bg-red-500/20 border-red-500/50"
        } border-2`}>
          <p className="text-xl text-white font-semibold mb-2">{message}</p>
          {status === "testing" && (
            <div className="flex items-center gap-2 text-white/80">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Connecting...</span>
            </div>
          )}
        </div>

        {details && (
          <div className="bg-gray-800/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Details:</h2>
            <pre className="text-sm text-gray-300 overflow-auto">
              {JSON.stringify(details, null, 2)}
            </pre>
          </div>
        )}

        {status === "success" && (
          <div className="mt-6 space-y-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <h3 className="text-green-400 font-semibold mb-2">✅ Next Steps:</h3>
              <ol className="text-white/90 space-y-2 text-sm list-decimal list-inside">
                <li>Go to Supabase Dashboard → SQL Editor</li>
                <li>Copy the content from <code className="bg-black/30 px-2 py-1 rounded">supabase/schema.sql</code></li>
                <li>Paste and run it to create all tables</li>
                <li>Go to Authentication → Providers to enable Google OAuth (optional)</li>
                <li>Go to Storage to create buckets (avatars, group-files, etc.)</li>
              </ol>
            </div>

            <div className="flex gap-4">
              <a
                href="/auth/login"
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl text-center transition-colors"
              >
                Try Login Page
              </a>
              <a
                href="/"
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl text-center transition-colors"
              >
                Go Home
              </a>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <h3 className="text-red-400 font-semibold mb-2">Troubleshooting:</h3>
            <ul className="text-white/90 space-y-2 text-sm list-disc list-inside">
              <li>Verify your Supabase project URL is correct</li>
              <li>Check that the anon key is the <strong>anon public</strong> key, not the service role key</li>
              <li>Make sure you restarted the dev server after adding env vars</li>
              <li>Check SUPABASE_SETUP.md for detailed instructions</li>
            </ul>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={testSupabaseConnection}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Test Again
          </button>
        </div>
      </div>
    </div>
  );
}
