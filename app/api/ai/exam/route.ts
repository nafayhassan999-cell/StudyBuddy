import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    const { topic, difficulty, count, time } = await request.json();

    if (!topic || !difficulty || !count || !time) {
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

    const prompt = `Generate exactly ${count} ${difficulty} multiple choice questions about "${topic}".

Requirements:
1. Each question must have exactly 4 options labeled A, B, C, D
2. Include the correct answer (A, B, C, or D)
3. Include a brief explanation of why the answer is correct
4. Questions should be at ${difficulty} difficulty level
5. Make questions practical and test real understanding

Return ONLY a valid JSON array with this EXACT structure (no markdown, no explanations, no extra text):
[
  {
    "q": "What is the question text?",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "answer": "A",
    "explanation": "Explanation of why A is correct"
  }
]

Generate exactly ${count} questions now:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up the response
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    // Parse the JSON response
    let questions;
    try {
      questions = JSON.parse(text);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      
      // Return fallback mock questions
      questions = Array.from({ length: count }, (_, i) => ({
        q: `Sample ${difficulty} question ${i + 1} about ${topic}?`,
        options: [
          "Option A - First choice",
          "Option B - Second choice",
          "Option C - Third choice",
          "Option D - Fourth choice"
        ],
        answer: ["A", "B", "C", "D"][Math.floor(Math.random() * 4)],
        explanation: "This is a sample explanation. AI generated invalid format, using fallback questions."
      }));
    }

    // Validate the response structure
    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "Invalid exam format generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      questions,
      metadata: {
        topic,
        difficulty,
        count,
        timeLimit: time,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error generating exam:", error);
    return NextResponse.json(
      { error: "AI busy, please try again", details: error.message },
      { status: 500 }
    );
  }
}
