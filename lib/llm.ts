import "server-only";

import { GoogleGenAI } from "@google/genai";
import type { z } from "zod";

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
 * Supports both:
 * - generateJson(input) -> returns parsed JSON object
 * - generateJson(schema, input) or generateJson(input, schema) -> validates against Zod schema
 */
export async function generateJson<T extends z.ZodTypeAny>(
  schema: T,
  input: GenerateJsonInput,
): Promise<z.infer<T>>;
export async function generateJson<T extends z.ZodTypeAny>(
  input: GenerateJsonInput,
  schema?: T,
): Promise<unknown>;
export async function generateJson<T extends z.ZodTypeAny>(
  arg1: T | GenerateJsonInput,
  arg2?: T | GenerateJsonInput,
): Promise<unknown> {
  let schema: T | undefined;
  let input: GenerateJsonInput;

  if (arg2 === undefined) {
    const maybeInput = arg1 as GenerateJsonInput;
    if (
      maybeInput &&
      typeof maybeInput === "object" &&
      "system" in maybeInput &&
      "prompt" in maybeInput
    ) {
      input = maybeInput;
      schema = undefined;
    } else {
      throw new Error("Invalid generateJson call: missing input");
    }
  } else if (
    arg1 &&
    typeof arg1 === "object" &&
    "parse" in arg1 &&
    typeof (arg1 as z.ZodTypeAny).parse === "function"
  ) {
    schema = arg1 as T;
    input = arg2 as GenerateJsonInput;
  } else {
    input = arg1 as GenerateJsonInput;
    schema = arg2 as T | undefined;
  }

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

  const parsed: unknown = JSON.parse(raw);

  if (schema) {
    return schema.parse(parsed);
  }

  return parsed;
}
