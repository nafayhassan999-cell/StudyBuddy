/**
 * Gemini AI API Integration
 * Provides function to interact with Google's Gemini Pro model
 * Includes fallback responses when AI is unavailable
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Fallback responses for when AI is unavailable
const FALLBACK_RESPONSES: Record<string, string[]> = {
  greeting: [
    "Hello! I'm StudyBuddy AI. While I'm having some technical difficulties, here are some study tips:\n\n1. 📚 **Break your study sessions** into 25-minute focused blocks (Pomodoro Technique)\n2. 🎯 **Set clear goals** for each study session\n3. 📝 **Take active notes** - summarize in your own words\n4. 🔄 **Review regularly** - spaced repetition helps retention\n5. 💤 **Get enough sleep** - it's crucial for memory consolidation\n\nTry again in a moment and I'll be happy to help with your specific questions!",
  ],
  study: [
    "Great question about studying! Here are some evidence-based tips:\n\n📖 **Active Recall**: Test yourself instead of re-reading\n🔁 **Spaced Repetition**: Review material at increasing intervals\n✍️ **Elaboration**: Explain concepts in your own words\n🔗 **Interleaving**: Mix different topics in one session\n🎯 **Concrete Examples**: Connect abstract ideas to real situations\n\nThe AI is temporarily busy, but try again soon for personalized help!",
  ],
  math: [
    "Math can be challenging! Here are some tips:\n\n1. 🔢 **Practice daily** - consistency is key\n2. 📐 **Understand concepts** before memorizing formulas\n3. ✏️ **Show all your work** - it helps find errors\n4. 🔄 **Review mistakes** - they're learning opportunities\n5. 📊 **Visualize problems** when possible\n\nI'll be back online shortly to help with specific problems!",
  ],
  science: [
    "Science is fascinating! Here's how to study it effectively:\n\n🔬 **Understand the method**: Hypothesis → Experiment → Analysis\n📊 **Learn to read graphs** and data tables\n🧪 **Connect theory to practice** with experiments\n📚 **Build vocabulary** - scientific terms matter\n🔗 **Find real-world applications** for concepts\n\nTry again in a moment for specific help!",
  ],
  default: [
    "I'm currently experiencing high demand! Here are some helpful study resources while you wait:\n\n📚 **Khan Academy** - Free courses on many subjects\n🎓 **Coursera** - University-level courses\n📖 **Quizlet** - Flashcards and study sets\n🧠 **Anki** - Spaced repetition software\n\nPlease try your question again in about 30 seconds!",
    "The AI tutor is taking a short break! In the meantime:\n\n💡 **Study Tip**: The best time to review new material is within 24 hours of learning it.\n\n📝 **Quick Exercise**: Write down 3 things you learned today without looking at your notes.\n\nI'll be ready to help shortly!",
  ],
};

/**
 * Get a fallback response based on the user's question
 */
export function getFallbackResponse(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi') || lowerPrompt.includes('hey')) {
    return FALLBACK_RESPONSES.greeting[0];
  }
  if (lowerPrompt.includes('math') || lowerPrompt.includes('calcul') || lowerPrompt.includes('algebra') || lowerPrompt.includes('equation')) {
    return FALLBACK_RESPONSES.math[0];
  }
  if (lowerPrompt.includes('science') || lowerPrompt.includes('physics') || lowerPrompt.includes('chemistry') || lowerPrompt.includes('biology')) {
    return FALLBACK_RESPONSES.science[0];
  }
  if (lowerPrompt.includes('study') || lowerPrompt.includes('learn') || lowerPrompt.includes('memoriz')) {
    return FALLBACK_RESPONSES.study[0];
  }
  
  // Return random default response
  const defaults = FALLBACK_RESPONSES.default;
  return defaults[Math.floor(Math.random() * defaults.length)];
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Call the Gemini API with a text prompt using the official SDK
 * @param prompt - The text prompt to send to Gemini
 * @param retries - Number of retries for rate limiting (default 3)
 * @returns The generated text response from Gemini
 * @throws Error if API key is missing or request fails
 */
export async function callGemini(prompt: string, retries: number = 3): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Wait before retry (exponential backoff)
      if (attempt > 0) {
        const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`Rate limited. Waiting ${waitTime/1000}s before retry ${attempt}/${retries}...`);
        await sleep(waitTime);
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      // Use Gemini 2.5 Flash model
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('No text response from Gemini API');
      }

      return text;
    } catch (error: any) {
      console.error(`Gemini API attempt ${attempt + 1} failed:`, error);
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Check for rate limit errors
      const errorMessage = error?.message?.toLowerCase() || '';
      const isRateLimit = errorMessage.includes('429') || 
                          errorMessage.includes('rate') || 
                          errorMessage.includes('quota') ||
                          errorMessage.includes('resource exhausted');
      
      if (isRateLimit && attempt < retries) {
        continue; // Retry
      }
      
      // Check for API key errors
      if (errorMessage.includes('api key') || errorMessage.includes('invalid') || errorMessage.includes('401') || errorMessage.includes('403')) {
        throw new Error('Invalid API key. Please check your Gemini API key in .env.local');
      }
      
      // Don't retry for non-rate-limit errors
      if (!isRateLimit) {
        throw lastError;
      }
    }
  }

  // All retries exhausted
  throw new Error('AI is currently overloaded. Please try again in a minute.');
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
