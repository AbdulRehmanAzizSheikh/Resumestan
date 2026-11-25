import { randomUUID } from "crypto";

const DEFAULT_MODEL = "gemini-2.5-flash";

/**
 * Shared client for calling the Google Gemini generateContent API.
 * Keeps one implementation of response parsing and error handling for all
 * AI features (analyze, recommendations, guides, edit guide).
 */

export function getGeminiModel() {
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

/**
 * Throws when the Gemini API key is not configured.
 */
export function requireGeminiApiKey() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key not configured");
  }
  return apiKey;
}

/**
 * Calls Gemini generateContent and returns the parsed JSON object.
 * @param {Object} options
 * @param {string} options.prompt - Text prompt.
 * @param {Array<{text?: string, inline_data?: {mime_type: string, data: string}}>} [options.parts] - Optional parts override (e.g. base64 attachments).
 * @param {number} [options.timeoutMs]
 * @returns {Promise<Object>} parsed JSON from the model response.
 * @throws {Error} When the API fails or the response cannot be parsed as JSON.
 */
export async function generateGeminiContent({ prompt, parts, timeoutMs = 60000 }) {
  const apiKey = requireGeminiApiKey();
  const textParts = parts || [{ text: prompt }];

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${getGeminiModel()}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: textParts }],
        generationConfig: { responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    }
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error("[gemini] API error:", data);
    throw new Error("AI request failed");
  }

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  const text = typeof rawText === "string" ? rawText : "";

  try {
    return JSON.parse(text);
  } catch {
    console.error("[gemini] unparseable response:", text.slice(0, 500));
    throw new Error("Failed to parse AI response");
  }
}

// Stable fallback export used by routes that want the request id for logging.
export const geminiRequestId = () => randomUUID();
