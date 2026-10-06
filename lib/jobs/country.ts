/**
 * Country detection for job search (context/job-search-expansion-plan.md B1).
 *
 * The find route used to hardcode `country: "us"`, which sent Lagos searches
 * into the US index — and Adzuna 404s (`UNSUPPORTED_COUNTRY`) outright for
 * Nigeria. `detectCountry` walks candidates in priority order (search location
 * → profile preferred locations → profile location) and falls back to "us".
 *
 * The result feeds: JSearch (valid ISO code for any country), the Adzuna
 * provider (unsupported codes are skipped there, see `lib/jobs/adzuna.ts`),
 * and the remote feeds (which ignore country entirely).
 *
 * Pure and dependency-free — no "@/…" imports, so it loads under `node --test`.
 */

export const DEFAULT_COUNTRY = "us";

/**
 * Country names/aliases → ISO 3166-1 alpha-2. Includes non-ISO spellings
 * ("uk" → gb) that must win over the bare two-letter passthrough.
 */
const COUNTRY_ALIASES: Record<string, string> = {
  "united states": "us",
  usa: "us",
  america: "us",
  "united kingdom": "gb",
  uk: "gb",
  britain: "gb",
  england: "gb",
  scotland: "gb",
  wales: "gb",
  nigeria: "ng",
  nigerian: "ng",
  ghana: "gh",
  ghanian: "gh",
  kenya: "ke",
  kenyan: "ke",
  "south africa": "za",
  egypt: "eg",
  germany: "de",
  german: "de",
  deutschland: "de",
  france: "fr",
  french: "fr",
  netherlands: "nl",
  dutch: "nl",
  holland: "nl",
  belgium: "be",
  switzerland: "ch",
  swiss: "ch",
  austria: "at",
  spain: "es",
  spanish: "es",
  italy: "it",
  italian: "it",
  poland: "pl",
  polish: "pl",
  portugal: "pt",
  ireland: "ie",
  sweden: "se",
  denmark: "dk",
  norway: "no",
  finland: "fi",
  india: "in",
  singapore: "sg",
  australia: "au",
  australian: "au",
  "new zealand": "nz",
  japan: "jp",
  china: "cn",
  "hong kong": "hk",
  "south korea": "kr",
  korea: "kr",
  uae: "ae",
  "united arab emirates": "ae",
  "saudi arabia": "sa",
  israel: "il",
  turkey: "tr",
  canada: "ca",
  canadian: "ca",
  mexico: "mx",
  brazil: "br",
  argentina: "ar",
  ukraine: "ua",
};

/**
 * Two-letter candidates are only accepted when they are a code we actually
 * recognise — "NG"/"us"/"gb" yes, a random "uu" no (never guess a country).
 */
const KNOWN_ISO = new Set([
  "ae", "ar", "at", "au", "be", "br", "ca", "ch", "cn", "de", "dk", "eg",
  "es", "fi", "fr", "gb", "gh", "hk", "ie", "il", "in", "it", "jp", "ke",
  "kr", "mx", "ng", "nl", "no", "nz", "pl", "pt", "sa", "se", "sg", "tr",
  "ua", "us", "za",
]);

/**
 * Major job-city → country. Keys are pre-normalised (lowercase, ASCII, no
 * diacritics) because candidates are normalised the same way before matching.
 */
const CITY_TO_COUNTRY: Record<string, string> = {
  // Africa
  lagos: "ng", abuja: "ng", "port harcourt": "ng", ibadan: "ng", kano: "ng",
  accra: "gh", kumasi: "gh",
  nairobi: "ke", mombasa: "ke",
  johannesburg: "za", "cape town": "za", durban: "za", pretoria: "za",
  cairo: "eg",
  // UK + Ireland
  london: "gb", manchester: "gb", birmingham: "gb", edinburgh: "gb",
  glasgow: "gb", leeds: "gb", bristol: "gb", liverpool: "gb",
  cambridge: "gb", oxford: "gb",
  dublin: "ie",
  // Western + Central Europe
  paris: "fr", lyon: "fr", marseille: "fr",
  berlin: "de", munich: "de", hamburg: "de", cologne: "de", frankfurt: "de",
  stuttgart: "de",
  amsterdam: "nl", rotterdam: "nl", "the hague": "nl", utrecht: "nl",
  brussels: "be", antwerp: "be",
  zurich: "ch", geneva: "ch", basel: "ch",
  vienna: "at", graz: "at",
  madrid: "es", barcelona: "es", valencia: "es",
  rome: "it", milan: "it", turin: "it", venice: "it", florence: "it",
  warsaw: "pl", krakow: "pl", wroclaw: "pl", poznan: "pl",
  lisbon: "pt", porto: "pt",
  stockholm: "se", copenhagen: "dk", oslo: "no", helsinki: "fi",
  kyiv: "ua", kiev: "ua", istanbul: "tr",
  // Americas
  "new york": "us", "san francisco": "us", seattle: "us", austin: "us",
  boston: "us", chicago: "us", "los angeles": "us", denver: "us",
  atlanta: "us", miami: "us", dallas: "us", houston: "us", phoenix: "us",
  portland: "us",
  toronto: "ca", vancouver: "ca", montreal: "ca", ottawa: "ca", calgary: "ca",
  "mexico city": "mx", guadalajara: "mx", monterrey: "mx",
  "sao paulo": "br", "rio de janeiro": "br", brasilia: "br",
  "buenos aires": "ar",
  // Asia-Pacific + Middle East
  mumbai: "in", delhi: "in", bangalore: "in", bengaluru: "in",
  hyderabad: "in", chennai: "in", pune: "in", kolkata: "in",
  singapore: "sg",
  sydney: "au", melbourne: "au", brisbane: "au", perth: "au", adelaide: "au",
  auckland: "nz", wellington: "nz", christchurch: "nz",
  tokyo: "jp", osaka: "jp",
  seoul: "kr", "hong kong": "hk",
  dubai: "ae", "abu dhabi": "ae", riyadh: "sa", "tel aviv": "il",
};

// Longest first so "united states" wins over any shorter overlapping alias
// and "rio de janeiro" over a single-word city if one is ever added.
const ALIAS_TERMS = Object.keys(COUNTRY_ALIASES).sort((a, b) => b.length - a.length);
const CITY_TERMS = Object.keys(CITY_TO_COUNTRY).sort((a, b) => b.length - a.length);

/** Lowercase, strip diacritics ("São Paulo" → "sao paulo"), collapse junk. */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function matchesTerm(text: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(text);
}

/**
 * Best-effort ISO country from a single free-text candidate.
 * Returns null when nothing matches ("Remote", "Atlantis", empty, null) so
 * the caller can move to the next candidate instead of guessing.
 */
export function countryFromText(text: string | null | undefined): string | null {
  if (!text) {
    return null;
  }
  const normalized = normalizeText(text);
  if (!normalized) {
    return null;
  }

  // Bare two-letter candidates ("NG", "us") — aliases first so "uk" → gb.
  if (/^[a-z]{2}$/.test(normalized)) {
    const aliased = COUNTRY_ALIASES[normalized];
    if (aliased) {
      return aliased;
    }
    return KNOWN_ISO.has(normalized) ? normalized : null;
  }

  for (const term of ALIAS_TERMS) {
    if (matchesTerm(normalized, term)) {
      return COUNTRY_ALIASES[term]!;
    }
  }
  for (const term of CITY_TERMS) {
    if (matchesTerm(normalized, term)) {
      return CITY_TO_COUNTRY[term]!;
    }
  }
  return null;
}

/**
 * Walk candidates in priority order — plan B1: the location the user typed
 * first, then the profile's `preferred_locations`, then its `location` —
 * and fall back to DEFAULT_COUNTRY ("us") when nothing resolves.
 */
export function detectCountry(
  primary?: string | null,
  fallbacks: ReadonlyArray<string | null | undefined> = [],
): string {
  for (const candidate of [primary, ...fallbacks]) {
    const country = countryFromText(candidate);
    if (country) {
      return country;
    }
  }
  return DEFAULT_COUNTRY;
}
