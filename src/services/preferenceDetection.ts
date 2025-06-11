import { UserPreferences } from "../hooks/useChat";
import {
  countries,
  continents,
  commonDestinations,
  continentMap,
} from "../data/travelData";

// Fuzzy matching function for handling misspellings
export const fuzzyMatch = (
  input: string,
  target: string,
  threshold: number = 0.7
): boolean => {
  input = input.toLowerCase().trim();
  target = target.toLowerCase().trim();

  // Exact match
  if (input === target) return true;

  // Calculate similarity using a simple approach
  const longer = input.length > target.length ? input : target;

  if (longer.length === 0) return true;

  // Count matching characters
  let matches = 0;
  const targetChars = target.split("");
  const inputChars = input.split("");

  for (const char of inputChars) {
    const index = targetChars.indexOf(char);
    if (index !== -1) {
      matches++;
      targetChars.splice(index, 1); // Remove matched character
    }
  }

  const similarity = matches / longer.length;
  return similarity >= threshold;
};

// Find best fuzzy match from a list
export const findFuzzyMatch = (
  input: string,
  candidates: string[]
): string | null => {
  // First try exact match
  const exactMatch = candidates.find(
    (candidate) => candidate.toLowerCase() === input.toLowerCase()
  );
  if (exactMatch) return exactMatch;

  // Then try fuzzy matching
  for (const candidate of candidates) {
    if (fuzzyMatch(input, candidate, 0.6)) {
      // Lower threshold for more flexibility
      return candidate;
    }
  }

  return null;
};

// Natural language detection for preference changes
export const detectPreferenceChanges = (
  message: string
): Partial<UserPreferences> | null => {
  const changes: Partial<UserPreferences> = {};

  // Strict country detection patterns - only explicit preference changes
  const countryPatterns = [
    /(?:change|update|set)\s+(?:my\s+)?(?:favorite|favourite)\s+(?:country|nation)\s+(?:to|is|as)\s+([a-z\s]+?)(?:\s|$|,|\.)/i,
    /(?:my\s+)?(?:favorite|favourite)\s+(?:country|nation)\s+(?:is\s+now|should\s+be|is)\s+([a-z\s]+?)(?:\s|$|,|\.)/i,
    /(?:prefer|want)\s+([a-z\s]+?)\s+(?:as\s+my\s+)?(?:favorite|favourite)\s+(?:country|nation)/i,
    /(?:make|set)\s+([a-z\s]+?)\s+(?:my\s+)?(?:favorite|favourite)\s+(?:country|nation)/i,
  ];

  // Try to detect country changes
  for (const pattern of countryPatterns) {
    const match = message.match(pattern);
    if (match) {
      const potentialCountry = match[1].trim();

      // Use fuzzy matching to find the best country match
      const matchedCountry = findFuzzyMatch(potentialCountry, countries);

      if (matchedCountry) {
        changes.country = matchedCountry
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        // Auto-set continent based on country
        if (continentMap[matchedCountry]) {
          changes.continent = continentMap[matchedCountry];
        }

        // Don't automatically change destination - only change if explicitly requested
        break;
      }
    }
  }

  // Strict continent detection patterns (with more flexible regex)
  const continentPatterns = [
    /(?:change|update|set)\s+(?:my\s+)?(?:favorite|favourite)\s+continent\s+(?:to|is|as)\s+([a-z\s]+?)(?:\s|$|,|\.)/i,
    /(?:my\s+)?(?:favorite|favourite)\s+continent\s+(?:is\s+now|should\s+be|is)\s+([a-z\s]+?)(?:\s|$|,|\.)/i,
    /(?:make|set)\s+([a-z\s]+?)\s+(?:my\s+)?(?:favorite|favourite)\s+continent/i,
  ];

  for (const pattern of continentPatterns) {
    const match = message.match(pattern);
    if (match) {
      const potentialContinent = match[1].trim();
      const matchedContinent = findFuzzyMatch(potentialContinent, continents);

      if (matchedContinent) {
        changes.continent = matchedContinent;
      }
    }
  }

  // Strict destination detection patterns
  const destinationPatterns = [
    /(?:change|update|set)\s+(?:my\s+)?(?:favorite|favourite)\s+destination\s+(?:to|is|as)\s+([a-z\s]+?)(?:\s|$|,|\.)/i,
    /(?:my\s+)?(?:favorite|favourite)\s+destination\s+(?:is\s+now|should\s+be|is)\s+([a-z\s]+?)(?:\s|$|,|\.)/i,
    /(?:make|set)\s+([a-z\s]+?)\s+(?:my\s+)?(?:favorite|favourite)\s+destination/i,
  ];

  for (const pattern of destinationPatterns) {
    const match = message.match(pattern);
    if (match) {
      const potentialDestination = match[1].trim();

      // Try fuzzy matching with common destinations first
      let matchedDestination = findFuzzyMatch(
        potentialDestination,
        commonDestinations
      );

      // If no match in common destinations, use the input as-is (capitalize properly)
      if (!matchedDestination) {
        matchedDestination = potentialDestination
          .split(" ")
          .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .join(" ");
      }

      changes.destination = matchedDestination;
    }
  }

  // Return changes if any were detected
  return Object.keys(changes).length > 0 ? changes : null;
};
