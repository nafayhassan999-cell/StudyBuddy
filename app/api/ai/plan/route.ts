import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    const { topic, days, goal, hours } = await request.json();

    if (!topic || !days || !goal || !hours) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured. Please add GEMINI_API_KEY to your .env file." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Create a detailed ${days}-day study plan for learning "${topic}".

Study Goal: ${goal}
Daily Study Time: ${hours} hours per day

Requirements:
1. Break down the topic into ${days} progressive daily lessons
2. Include 2 quizzes spread across the plan (mark which days)
3. Include 1 final project on the last day or near the end
4. Each day should have 3-5 specific tasks
5. Tasks should be actionable (Read, Watch, Practice, Build, Quiz, etc.)
6. Estimate realistic duration for each day based on ${hours} hours limit

Return ONLY a valid JSON array with this exact structure (no markdown, no explanations):
[
  {
    "day": 1,
    "title": "Day 1: Introduction to Basics",
    "tasks": [
      "Read introductory materials",
      "Watch tutorial video",
      "Complete practice exercises"
    ],
    "duration": "2h",
    "type": "lesson"
  },
  {
    "day": 2,
    "title": "Day 2: Core Concepts",
    "tasks": [
      "Study main principles",
      "Take notes on key concepts",
      "Quiz 1: Basics assessment"
    ],
    "duration": "2.5h",
    "type": "quiz"
  }
]

Make it comprehensive, practical, and achievable within the time constraints.`;

    // Retry logic for handling temporary API issues
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up the response - remove markdown code blocks if present
        text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

        // Parse the JSON response
        let studyPlan;
        try {
          studyPlan = JSON.parse(text);
        } catch (parseError) {
          console.error("Failed to parse Gemini response:", text);
          return NextResponse.json(
            { error: "AI generated invalid format. Please try again." },
            { status: 500 }
          );
        }

        // Validate the response structure
        if (!Array.isArray(studyPlan) || studyPlan.length === 0) {
          return NextResponse.json(
            { error: "Invalid study plan format" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          plan: studyPlan,
          metadata: {
            topic,
            days,
            goal,
            hours,
            generatedAt: new Date().toISOString(),
          },
        });
      } catch (err: any) {
        lastError = err;
        console.log(`Attempt ${attempt} failed:`, err.message);
        
        // If it's a 503 (overloaded), wait before retrying
        if (err.message?.includes("503") || err.message?.includes("overloaded")) {
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, attempt * 2000)); // Wait 2s, 4s
            continue;
          }
        } else {
          // For other errors, don't retry
          throw err;
        }
      }
    }
    
    // If all retries failed, throw the last error
    throw lastError;
  } catch (error: any) {
    console.error("Error generating study plan:", error);
    
    // Handle specific Google AI errors
    if (error.message?.includes("503") || error.message?.includes("overloaded")) {
      return NextResponse.json(
        { error: "Google AI is currently overloaded. Please wait a moment and try again." },
        { status: 503 }
      );
    }
    
    if (error.message?.includes("404") || error.message?.includes("not found")) {
      return NextResponse.json(
        { error: "AI model not available. Please contact support." },
        { status: 500 }
      );
    }
    
    if (error.message?.includes("API key")) {
      return NextResponse.json(
        { error: "API key error. Please restart the development server." },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to generate plan. Please try again in a moment.", details: error.message },
      { status: 500 }
    );
  }
}
