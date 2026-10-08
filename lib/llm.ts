import "server-only";

import { generateObject } from "ai";
import { groq } from "@ai-sdk/groq";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { z } from "zod";

const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_OPENROUTER_MODEL = "openrouter/auto";

export type GenerateJsonInput = {
  system: string;
  prompt: string;
  temperature: number;
  maxOutputTokens: number;
  thinkingBudget?: number; // ignored for non-Google providers
};

type ProviderAttempt = {
  id: "groq" | "openrouter";
  model: () => unknown;
};

let openRouterProvider: ReturnType<typeof createOpenRouter> | null = null;

function getOpenRouterProvider() {
  if (openRouterProvider) return openRouterProvider;
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
  const openrouterKey = env.OPENROUTER_API_KEY;
  if (!openrouterKey) {
    throw new Error("OPENROUTER_API_KEY is not set. Add it to .env.local.");
  }
  openRouterProvider = createOpenRouter({ apiKey: openrouterKey });
  return openRouterProvider;
}

function getProviderOrder(): ProviderAttempt[] {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
  const order = typeof env.AI_PROVIDER_ORDER === "string" ? env.AI_PROVIDER_ORDER.trim().toLowerCase() : "";
  const groqModelEnv = env.GROQ_MODEL;
  const openrouterModelEnv = env.OPENROUTER_MODEL;
  const defaultOrder: ProviderAttempt[] = [
    {
      id: "groq",
      model: () =>
        groq((groqModelEnv ?? "").trim() || DEFAULT_GROQ_MODEL),
    },
    {
      id: "openrouter",
      model: () =>
        getOpenRouterProvider().chat(
          (openrouterModelEnv ?? "").trim() || DEFAULT_OPENROUTER_MODEL,
        ),
    },
  ];

  if (!order) return defaultOrder;

  return order
    .split(",")
    .map((p: unknown) => String(p).trim())
    .filter(Boolean)
    .map((p: string): ProviderAttempt | null => {
      if (p === "groq") {
        return {
          id: "groq",
          model: () => {
            const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
            const groqModelEnv = env.GROQ_MODEL;
            return groq((groqModelEnv ?? "").trim() || DEFAULT_GROQ_MODEL);
          },
        };
      }
      if (p === "openrouter") {
        return {
          id: "openrouter",
          model: () => {
            const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
            const openrouterModelEnv = env.OPENROUTER_MODEL;
            return getOpenRouterProvider().chat(
              (openrouterModelEnv ?? "").trim() || DEFAULT_OPENROUTER_MODEL,
            );
          },
        };
      }
      return null;
    })
    .filter((v: ProviderAttempt | null): v is ProviderAttempt => v !== null);
}

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
  // Handle overloaded forms: (schema, input) or (input, schema?)
  let schema: T | undefined;
  let input: GenerateJsonInput;
  if (arg2 === undefined) {
    // (input) or (schema, input)? If first has system/prompt fields, treat as input without schema (legacy)
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
      // treat as schema with missing input? not expected; throw
      throw new Error("Invalid generateJson call: missing input");
    }
  } else {
    // (schema, input)
    schema = arg1 as T;
    input = arg2 as GenerateJsonInput;
  }

  const providers = getProviderOrder();
  if (providers.length === 0) {
    throw new Error(
      "No AI providers configured (set GROQ_API_KEY and/or OPENROUTER_API_KEY and AI_PROVIDER_ORDER).",
    );
  }

  let lastError: unknown;
  for (const p of providers) {
    try {
      const model = p.model() as any;
      if (schema) {
        const result = await generateObject({
          model,
          schema,
          system: input.system,
          prompt: input.prompt,
          temperature: input.temperature,
          maxOutputTokens: input.maxOutputTokens,
        } as any);
        return result.object;
      } else {
        // Legacy path: generate text-like JSON? But we want structured; require schema going forward
        // Fallback to generateObject with loose schema not ideal; throw to force migration
        throw new Error(
          "generateJson called without schema. Migrate callers to pass Zod schema.",
        );
      }
    } catch (err) {
      console.warn(`[llm] provider ${p.id} failed, trying fallback:`, err);
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
