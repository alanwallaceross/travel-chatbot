export interface StructuredComponent {
  title: string;
  description: string;
  imageQuery: string;
}

export interface ParsedMessage {
  isStructured: boolean;
  intro?: string;
  components?: StructuredComponent[];
  originalText: string;
}

// Function to strip place markers from text for display
export const stripPlaceMarkers = (text: string): string => {
  return text.replace(/\[PLACE\](.*?)\[\/PLACE\]/g, "$1");
};

// Function to detect if title contains a place name and generate Google Maps URL
export const generateGoogleMapsLink = (title: string): string | null => {
  // Look for [PLACE]Place Name[/PLACE] markers
  const placeMatch = title.match(/\[PLACE\](.*?)\[\/PLACE\]/);

  if (placeMatch) {
    // Extract the place name from the markers
    const placeName = placeMatch[1].trim();
    if (placeName) {
      // Generate Google Maps search URL using the extracted place name
      const searchQuery = encodeURIComponent(placeName);
      return `https://www.google.com/maps/search/${searchQuery}`;
    }
  }

  return null;
};

// Function to break long text into consumable chunks
export const breakIntoChunks = (
  text: string,
  maxLength: number = 300
): string[] => {
  if (text.length <= maxLength) return [text];

  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length <= maxLength) {
      currentChunk += (currentChunk ? " " : "") + sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = sentence;
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks;
};

const parseCustomStructuredResponse = (text: string): ParsedMessage => {
  try {
    const lines = text.split("\n");
    let intro = "";
    const components: StructuredComponent[] = [];
    let inComponent = false;
    let collectingDescription = false;
    let currentComponent: Partial<StructuredComponent> = {};
    let descriptionLines: string[] = [];
    let startFound = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine === "**STRUCTURED_RESPONSE_START**") {
        startFound = true;
        continue;
      }

      if (trimmedLine === "**STRUCTURED_RESPONSE_END**") {
        break;
      }

      if (!startFound) continue;

      if (trimmedLine.startsWith("**COMPONENT_")) {
        if (currentComponent.title && descriptionLines.length > 0) {
          currentComponent.description = descriptionLines.join(" ");
          components.push({
            title: currentComponent.title,
            description: currentComponent.description,
            imageQuery: currentComponent.title
              .toLowerCase()
              .replace(/[^a-z0-9\s]/g, "")
              .replace(/\s+/g, "+"),
          });
        }
        inComponent = true;
        collectingDescription = false;
        currentComponent = {};
        descriptionLines = [];
      } else if (trimmedLine === "**COMPONENT_END**") {
        if (currentComponent.title && descriptionLines.length > 0) {
          currentComponent.description = descriptionLines.join(" ");
          components.push({
            title: currentComponent.title,
            description: currentComponent.description,
            imageQuery: currentComponent.title
              .toLowerCase()
              .replace(/[^a-z0-9\s]/g, "")
              .replace(/\s+/g, "+"),
          });
        }
        inComponent = false;
        collectingDescription = false;
        currentComponent = {};
        descriptionLines = [];
      } else if (inComponent) {
        if (trimmedLine.startsWith("Title:")) {
          // Store the title with markers for map generation, but display without markers
          const rawTitle = trimmedLine.replace("Title:", "").trim();
          currentComponent.title = rawTitle; // Keep markers for map generation
        } else if (trimmedLine.startsWith("Description:")) {
          collectingDescription = true;
          const descPart = trimmedLine.replace("Description:", "").trim();
          if (descPart) {
            descriptionLines.push(descPart);
          }
        } else if (collectingDescription && trimmedLine) {
          descriptionLines.push(trimmedLine);
        }
      } else if (!inComponent && trimmedLine) {
        intro += (intro ? " " : "") + trimmedLine;
      }
    }

    return {
      isStructured: true,
      intro,
      components,
      originalText: text,
    };
  } catch (error) {
    console.error("Error parsing custom structured response:", error);
    return { isStructured: false, originalText: text };
  }
};

const parseNaturalStructuredResponse = (text: string): ParsedMessage => {
  try {
    const lines = text.split("\n");
    const components: StructuredComponent[] = [];
    let intro = "";
    let currentComponent: Partial<StructuredComponent> = {};
    let collectingDescription = false;
    let descriptionLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Look for pattern: **Title** Description: content
      const titleMatch = line.match(/^\*\*(.*?)\*\*\s*Description:\s*(.*)/);

      if (titleMatch) {
        // Save previous component if exists
        if (currentComponent.title && descriptionLines.length > 0) {
          currentComponent.description = descriptionLines.join(" ").trim();
          components.push({
            title: currentComponent.title,
            description: currentComponent.description,
            imageQuery: currentComponent.title
              .toLowerCase()
              .replace(/[^a-z0-9\s]/g, "")
              .replace(/\s+/g, "+"),
          });
        }

        // Start new component
        currentComponent = {
          title: titleMatch[1].trim(),
        };
        descriptionLines = [titleMatch[2].trim()];
        collectingDescription = true;
      } else if (collectingDescription && line) {
        // Continue collecting description lines
        descriptionLines.push(line);
      } else if (!collectingDescription && line && !line.includes("**")) {
        // This is intro text
        intro += (intro ? " " : "") + line;
      }
    }

    // Add the last component
    if (currentComponent.title && descriptionLines.length > 0) {
      currentComponent.description = descriptionLines.join(" ").trim();
      components.push({
        title: currentComponent.title,
        description: currentComponent.description,
        imageQuery: currentComponent.title
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, "")
          .replace(/\s+/g, "+"),
      });
    }

    return {
      isStructured: components.length > 0,
      intro: intro || undefined,
      components: components.length > 0 ? components : undefined,
      originalText: text,
    };
  } catch (error) {
    console.error("Error parsing natural structured response:", error);
    return { isStructured: false, originalText: text };
  }
};

export const parseStructuredResponse = (text: string): ParsedMessage => {
  // Check for the structured format we specified in the system prompt
  if (text.includes("**STRUCTURED_RESPONSE_START**")) {
    return parseCustomStructuredResponse(text);
  }

  // Check for AI's natural structured format using **Title** Description: pattern
  if (text.includes("**") && text.includes("Description:")) {
    return parseNaturalStructuredResponse(text);
  }

  return { isStructured: false, originalText: text };
};
