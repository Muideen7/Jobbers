import Browserbase from "@browserbasehq/sdk";

let client: Browserbase | null = null;

export function getBrowserbase(): Browserbase {
  const apiKey = process.env.BROWSERBASE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "BROWSERBASE_API_KEY is not set. Add it to .env.local — see README.",
    );
  }

  client ??= new Browserbase({ apiKey });

  return client;
}