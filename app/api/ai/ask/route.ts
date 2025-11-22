import { NextRequest, NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";

// CORS headers for development
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Simple in-memory rate limiting
// Map structure: userId -> { count, resetTime }
const rateLimit = new Map<string, { count: number; resetTime: number }>();

// Rate limit config
const RATE_LIMIT_MAX = 10; // Max requests per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

/**
 * Check if user has exceeded rate limit
 * @param userId - User identifier (IP or user ID)
 * @returns true if rate limit exceeded
 */
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimit.get(userId);

  if (!userLimit) {
    // First request from this user
    rateLimit.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  // Check if rate limit window has expired
  if (now > userLimit.resetTime) {
    // Reset the limit
    rateLimit.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  // Check if user has exceeded the limit
  if (userLimit.count >= RATE_LIMIT_MAX) {
    return true;
  }

  // Increment the counter
  userLimit.count += 1;
  rateLimit.set(userId, userLimit);
  return false;
}

/**
 * Get user identifier for rate limiting
 * Uses IP address or falls back to a default
 */
function getUserId(req: NextRequest): string {
  // Try to get IP from headers
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  
  return forwardedFor?.split(",")[0] || realIp || "anonymous";
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// POST: Ask AI a question
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt } = body;

    // Validate prompt
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        {
          error: "Prompt is required",
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    if (prompt.length > 2000) {
      return NextResponse.json(
        {
          error: "Prompt is too long (max 2000 characters)",
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Get user identifier for rate limiting
    const userId = getUserId(req);

    // Check rate limit
    if (checkRateLimit(userId)) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Try again later.",
        },
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Retry-After": "60",
          },
        }
      );
    }

    // Call Gemini API
    const reply = await callGemini(prompt);

    return NextResponse.json(
      {
        reply,
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("Error in AI ask endpoint:", error);

    // Check if it's an API key error
    if (error instanceof Error && error.message.includes("Missing GEMINI_API_KEY")) {
      return NextResponse.json(
        {
          error: "AI service is not configured",
        },
        {
          status: 503,
          headers: corsHeaders,
        }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        error: "Try again",
      },
      {
        status: 429,
        headers: corsHeaders,
      }
    );
  }
}
