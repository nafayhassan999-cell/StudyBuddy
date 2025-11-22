import { NextRequest, NextResponse } from "next/server";

// Helper function to call Gemini AI
async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
  return text;
}

export async function POST(req: NextRequest) {
  try {
    const { score, total, percentage, missedTopics, topic } = await req.json();

    // Validate input
    if (typeof score !== "number" || typeof total !== "number") {
      return NextResponse.json(
        { success: false, error: "Invalid score data" },
        { status: 400 }
      );
    }

    // Create a contextual prompt for AI feedback
    const prompt = `You are an encouraging study tutor. A student just completed a quiz on "${topic}".

Results:
- Score: ${score} out of ${total} (${percentage}%)
- Areas that need improvement: ${missedTopics.length > 0 ? missedTopics.join(", ") : "None - perfect score!"}

Provide 2-3 sentences of encouraging feedback. If they scored well, congratulate them and suggest next steps. If they struggled with certain topics, give specific study suggestions for those areas. Be positive, supportive, and actionable.`;

    // Call Gemini AI
    const feedback = await callGemini(prompt);

    return NextResponse.json({
      success: true,
      feedback: feedback.trim(),
    });
  } catch (error: any) {
    console.error("AI Feedback Error:", error);
    
    // Fallback feedback if AI fails
    const fallbackFeedback = "Great effort! Review the questions you missed and try focusing on those specific topics. Practice makes perfect!";
    
    return NextResponse.json({
      success: true,
      feedback: fallbackFeedback,
    });
  }
}
