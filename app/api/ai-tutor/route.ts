import { NextRequest, NextResponse } from "next/server";
import { callGemini, formatStudyPrompt } from "@/lib/gemini";

// CORS headers for development
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// POST: Ask AI Tutor a question
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, context } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Question is required",
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Format the prompt for better educational responses
    const prompt = formatStudyPrompt(question, context);

    // Call Gemini API
    const response = await callGemini(prompt);

    return NextResponse.json(
      {
        success: true,
        data: {
          question,
          answer: response,
          timestamp: new Date().toISOString(),
        },
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("Error calling AI tutor:", error);

    // Check if it's an API key error
    if (error instanceof Error && error.message.includes("Missing GEMINI_API_KEY")) {
      return NextResponse.json(
        {
          success: false,
          error: "AI Tutor is not configured. Please add GEMINI_API_KEY to environment variables.",
          message: error.message,
        },
        {
          status: 503,
          headers: corsHeaders,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get response from AI Tutor",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

// GET: Health check and example
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message: "AI Tutor API is ready",
      usage: {
        method: "POST",
        body: {
          question: "Your question here",
          context: "Optional subject/topic context",
        },
        example: {
          question: "What is the Pythagorean theorem?",
          context: "Geometry",
        },
      },
    },
    {
      status: 200,
      headers: corsHeaders,
    }
  );
}
