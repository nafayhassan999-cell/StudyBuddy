"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AuthSetupBanner() {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("auth-setup-banner-dismissed");
    setIsDismissed(dismissed === "true");
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("auth-setup-banner-dismissed", "true");
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-full mx-4">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 shadow-2xl border-2 border-orange-400/50 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-white flex-shrink-0 mt-0.5" />
          
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg mb-1">
              Getting 401 Error? Quick Fix! 🔧
            </h3>
            <p className="text-white/95 text-sm mb-2">
              Disable <strong>email confirmation</strong> in your Supabase dashboard for development:
            </p>
            <ol className="text-white/90 text-sm space-y-1 mb-3 ml-4 list-decimal">
              <li>Dashboard → <strong>Authentication</strong> → <strong>Providers</strong></li>
              <li>Click <strong>Email</strong></li>
              <li>Toggle <strong>OFF</strong> &quot;Confirm email&quot;</li>
              <li>Click <strong>Save</strong></li>
            </ol>
            <Link
              href="https://asdglggfwzeebcieckmq.supabase.co/project/_/auth/providers"
              target="_blank"
              className="inline-block bg-white text-orange-600 font-semibold px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors text-sm"
            >
              Open Supabase Dashboard →
            </Link>
          </div>

          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
