import { createOpenAI } from "@ai-sdk/openai";

/**
 * Dynamically resolves the AI model provider based on configured API keys.
 * Leverages Groq or Google Gemini free-tiers if present, falling back to OpenAI.
 */
export function getAIModel() {
  // 1. Google Gemini Free-Tier (OpenAI Compatible Endpoint)
  if (process.env.GEMINI_API_KEY) {
    const gemini = createOpenAI({
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });
    return gemini("gemini-1.5-flash");
  }

  // 2. Groq Free-Tier Llama 3 (OpenAI Compatible Endpoint)
  if (process.env.GROQ_API_KEY) {
    const groq = createOpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
    return groq("llama-3.3-70b-versatile");
  }

  // 3. Fallback to standard OpenAI
  const openaiClient = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  return openaiClient("gpt-4o");
}
