import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_COUNTRY,
  countryFromText,
  detectCountry,
} from "../lib/jobs/country.ts";
import {
  ADZUNA_SUPPORTED_COUNTRIES,
  adzunaProvider,
  isAdzunaCountrySupported,
} from "../lib/jobs/adzuna.ts";

test("countryFromText maps known cities to ISO codes", () => {
  assert.equal(countryFromText("Lagos"), "ng");
  assert.equal(countryFromText("Lagos, Nigeria"), "ng");
  assert.equal(countryFromText("London"), "gb");
  assert.equal(countryFromText("London, UK"), "gb");
  assert.equal(countryFromText("Accra"), "gh");
  assert.equal(countryFromText("Nairobi, Kenya"), "ke");
  assert.equal(countryFromText("Toronto"), "ca");
  assert.equal(countryFromText("Sydney"), "au");
  assert.equal(countryFromText("Bengaluru, India"), "in");
  // Diacritics are stripped before matching.
  assert.equal(countryFromText("São Paulo"), "br");
  assert.equal(countryFromText("Kraków"), "pl");
});

test("countryFromText honours bare two-letter codes, case-insensitively", () => {
  assert.equal(countryFromText("NG"), "ng");
  assert.equal(countryFromText(" us "), "us");
  assert.equal(countryFromText("Gb"), "gb");
  // Non-ISO or unknown two-letter guesses are rejected rather than guessed.
  assert.equal(countryFromText("uu"), null);
  assert.equal(countryFromText("xx"), null);
  // "uk" is not an ISO code but must resolve through the alias table.
  assert.equal(countryFromText("uk"), "gb");
});

test("countryFromText returns null for empty or unrecognised input", () => {
  assert.equal(countryFromText(null), null);
  assert.equal(countryFromText(undefined), null);
  assert.equal(countryFromText(""), null);
  assert.equal(countryFromText("   "), null);
  assert.equal(countryFromText("Remote"), null);
  assert.equal(countryFromText("Atlantis"), null);
});

test("detectCountry walks candidates in order: search → preferred → profile", () => {
  // Plan B1 table: Lagos→ng even with fallbacks present.
  assert.equal(detectCountry("Lagos", ["London", "Accra"]), "ng");
  // Empty search location falls through to the profile's preferred location.
  assert.equal(detectCountry("", ["Berlin", "Accra"]), "de");
  assert.equal(detectCountry("  ", [null, "Accra"]), "gh");
  // First fallback that resolves wins.
  assert.equal(detectCountry(null, ["nowhere", "Paris", "Lagos"]), "fr");
});

test("detectCountry defaults to 'us' when nothing resolves", () => {
  assert.equal(detectCountry("", []), DEFAULT_COUNTRY);
  assert.equal(detectCountry(null, [null, undefined]), "us");
  assert.equal(detectCountry(), "us");
  assert.equal(detectCountry("Remote", ["Anywhere"]), "us");
});

test("Adzuna support list covers exactly its 19 live-verified countries", () => {
  assert.equal(ADZUNA_SUPPORTED_COUNTRIES.length, 19);
  for (const code of ADZUNA_SUPPORTED_COUNTRIES) {
    assert.equal(isAdzunaCountrySupported(code), true, code);
    assert.equal(isAdzunaCountrySupported(code.toUpperCase()), true, code);
  }
  assert.equal(isAdzunaCountrySupported(" US "), true);
  assert.equal(isAdzunaCountrySupported("ng"), false);
  assert.equal(isAdzunaCountrySupported("gh"), false);
  assert.equal(isAdzunaCountrySupported("ke"), false);
  assert.equal(isAdzunaCountrySupported("pt"), false);
});

test("adzunaProvider skips unsupported countries without calling the API", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    return new Response(JSON.stringify({ results: [] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;

  try {
    // B1: ng (Adzuna 404s on it) → silent empty result, zero requests made.
    const jobs = await adzunaProvider.search({
      title: "developer",
      location: "Lagos",
      country: "ng",
    });
    assert.deepEqual(jobs, []);
    assert.equal(calls, 0, "Adzuna must be skipped, not called, for ng");

    // An unknown country code never reaches the API either.
    await adzunaProvider.search({
      title: "developer",
      location: "",
      country: "zz",
    });
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("adzunaProvider still calls through for supported countries", async () => {
  const originalFetch = globalThis.fetch;
  const requested: string[] = [];
  globalThis.fetch = (async (input: string | URL | Request) => {
    requested.push(String(input));
    return new Response(JSON.stringify({ results: [] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;

  try {
    await adzunaProvider.search({
      title: "developer",
      location: "",
      country: "gb",
    });
    assert.equal(requested.length, 1);
    const first = requested[0];
    assert.ok(first);
    assert.match(first, /\/gb\/search\/1/);

    // Empty country falls back to "us", which is supported.
    await adzunaProvider.search({ title: "developer", location: "", country: "" });
    assert.equal(requested.length, 2);
    const second = requested[1];
    assert.ok(second);
    assert.match(second, /\/us\/search\/1/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
