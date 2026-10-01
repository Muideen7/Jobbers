import { GoogleGenAI } from "@google/genai";

const DEFAULT_GEMINI_MODEL = "gemini-3-flash-preview";

let client: GoogleGenAI | null = null;

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

export function getGemini(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local — see README.",
    );
  }

  client ??= new GoogleGenAI({ apiKey });

  return client;
}

export type GenerateJsonInput = {
  system: string;
  prompt: string;
  temperature: number;
  maxOutputTokens: number;
  /**
   * Reasoning tokens to allow. Defaults to 0 (off) because thinking tokens
   * are drawn from maxOutputTokens and can truncate otherwise-valid JSON.
   */
  thinkingBudget?: number;
};

/**
 * Every AI call in this app asks for a single JSON object back, so the
 * responseMimeType/config plumbing and the empty-response guard live here
 * rather than being repeated per call site. Callers own their own error
 * handling and fallbacks because each one degrades differently.
 *
 * Thinking is disabled because Gemini 3 spends the reasoning tokens out of
 * `maxOutputTokens`. At an 800-token cap a 6-job scoring prompt used 590
 * tokens on thinking and truncated mid-JSON, so the parse failed. These
 * tasks are extract-then-format work where reasoning adds nothing; callers
 * that genuinely need deliberation should pass an explicit thinkingBudget.
 */
export async function generateJson(input: GenerateJsonInput): Promise<unknown> {
  const response = await getGemini().models.generateContent({
    model: getGeminiModel(),
    contents: input.prompt,
    config: {
      systemInstruction: input.system,
      temperature: input.temperature,
      maxOutputTokens: input.maxOutputTokens,
      responseMimeType: "application/json",
      thinkingConfig: {
        thinkingBudget: input.thinkingBudget ?? 0,
      },
    },
  });

  const raw = response.text;

  if (!raw) {
    throw new Error("Gemini returned an empty response.");
  }

  if (response.candidates?.[0]?.finishReason === "MAX_TOKENS") {
    throw new Error(
      `Gemini hit the ${input.maxOutputTokens}-token output cap before finishing the JSON. Raise maxOutputTokens for this call.`,
    );
  }

  return JSON.parse(raw);
}
