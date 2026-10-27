import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_COUNTRY,
  countryFromText,
  detectCountry,
} from "../lib/jobs/country.ts";

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
