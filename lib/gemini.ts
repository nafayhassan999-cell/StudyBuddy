/**
 * Gemini AI API Integration
 * Provides function to interact with Google's Gemini Pro model
 */

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
      role: string;
    };
    finishReason: string;
    index: number;
    safetyRatings: Array<any>;
  }>;
  promptFeedback?: {
    safetyRatings: Array<any>;
  };
}

/**
 * Call the Gemini API with a text prompt
 * @param prompt - The text prompt to send to Gemini
 * @returns The generated text response from Gemini
 * @throws Error if API key is missing or request fails
 */
export async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        `Gemini API request failed: ${res.status} ${res.statusText}. ${
          errorData.error?.message || ''
        }`
      );
    }

    const data: GeminiResponse = await res.json();

    // Extract the text from the response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No text response from Gemini API');
    }

    return text;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Error communicating with Gemini AI');
  }
}

/**
 * Call Gemini with streaming support (for future implementation)
 * @param prompt - The text prompt to send to Gemini
 * @param onChunk - Callback function to handle each chunk of the response
 */
export async function callGeminiStream(
  prompt: string,
  onChunk: (text: string) => void
): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
  }

  // Streaming implementation can be added later
  // For now, fall back to regular call
  const result = await callGemini(prompt);
  onChunk(result);
}

/**
 * Format a study-related prompt for better Gemini responses
 * @param question - The user's question
 * @param context - Optional context about the subject or topic
 */
export function formatStudyPrompt(question: string, context?: string): string {
  let prompt = `You are StudyBuddy AI, a helpful and friendly tutor. `;
  
  if (context) {
    prompt += `Context: ${context}\n\n`;
  }
  
  prompt += `Question: ${question}\n\n`;
  prompt += `Please provide a clear, educational response that helps the student understand the concept. `;
  prompt += `Use examples when helpful and break down complex topics into simpler parts.`;
  
  return prompt;
}
