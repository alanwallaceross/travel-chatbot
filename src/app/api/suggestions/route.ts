import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { aiResponse, userPreferences } = await req.json();

    if (!aiResponse || !userPreferences) {
      return NextResponse.json(
        { error: "Missing aiResponse or userPreferences" },
        { status: 400 }
      );
    }

    const prompt = `You are a travel assistant AI that generates relevant follow-up prompts for users to explore topics deeper.

Based on this AI response about travel:
"${aiResponse}"

And these user preferences:
- Favorite Country: ${userPreferences.country}
- Favorite Continent: ${userPreferences.continent}  
- Favorite Destination: ${userPreferences.destination}

Generate exactly 6 specific, actionable follow-up prompts that:
1. Dig deeper into topics mentioned in the AI response
2. Are personalized using the user's preferences (country/continent/destination)
3. Are statements/requests the user would send to you (not questions you ask the user)
4. Feel like natural conversation continuations
5. Avoid generic requests and focus on specifics from the response
6. Start with action words like "Tell me about...", "Give me details on...", "Explain...", "Show me...", etc.

Examples of good prompts:
- "Tell me more about the best local markets in Bangkok"
- "Give me a detailed itinerary for 3 days in Rome" 
- "Explain the visa requirements for visiting Japan"
- "Show me budget accommodation options in Amsterdam"

Format as a simple JSON array of strings, nothing else:
["prompt 1", "prompt 2", "prompt 3", "prompt 4", "prompt 5", "prompt 6"]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    // Parse the JSON response with error handling
    let suggestions;
    try {
      // Try to extract JSON array from the content
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      suggestions = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Content that failed to parse:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    if (!Array.isArray(suggestions)) {
      throw new Error("Response is not an array");
    }

    // Ensure we have exactly 6 suggestions, pad or truncate as needed
    if (suggestions.length < 6) {
      const fallbacks = [
        "Tell me about hidden gems worth visiting",
        "Give me unique local experiences to try",
        "Show me the best time to visit",
        "Explain important cultural tips I should know",
        "Tell me about local transportation options",
        "Give me daily budget recommendations",
      ];
      while (suggestions.length < 6) {
        suggestions.push(fallbacks[suggestions.length]);
      }
    } else if (suggestions.length > 6) {
      suggestions = suggestions.slice(0, 6);
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Error generating suggestions:", error);

    // Return generic fallback suggestions on error
    const fallbackSuggestions = [
      "Tell me about hidden gems worth visiting",
      "Give me unique local experiences to try",
      "Show me the best time to visit",
      "Explain important cultural tips I should know",
      "Tell me about local transportation options",
      "Give me daily budget recommendations",
    ];

    return NextResponse.json({ suggestions: fallbackSuggestions });
  }
}
