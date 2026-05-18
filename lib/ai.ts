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
    return (gemini as any)("gemini-1.5-flash", { structuredOutputs: false });
  }

  // 2. Groq Free-Tier Llama 3 (OpenAI Compatible Endpoint)
  if (process.env.GROQ_API_KEY) {
    const groq = createOpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
    return (groq as any)("llama-3.3-70b-versatile", { structuredOutputs: false });
  }

  // 3. Fallback to standard OpenAI
  const openaiClient = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  return openaiClient("gpt-4o");
}

/**
 * Dynamically resolves the embedding model based on configured API keys.
 * - Gemini: uses text-embedding-004 (free tier)
 * - Groq: no native embedding API, falls back to OpenAI
 * - OpenAI: text-embedding-3-small
 *
 * IMPORTANT: Convex vector index is fixed at 1536 dimensions (OpenAI).
 * Gemini text-embedding-004 outputs 768 dimensions by default but supports
 * outputDimensionality up to 768. We use OpenAI embeddings for seeding AND
 * querying to keep dimensions consistent. If you only have Gemini/Groq keys,
 * the RAG step is gracefully skipped — the rest of the pipeline still works.
 */
export function getEmbeddingModel() {
  // OpenAI is required for embeddings due to the fixed 1536-dim vector index.
  // If the key is present and quota allows, use it.
  if (process.env.OPENAI_API_KEY) {
    const openaiClient = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    return openaiClient.embedding("text-embedding-3-small");
  }

  // No embedding provider available — caller should handle gracefully.
  return null;
}
