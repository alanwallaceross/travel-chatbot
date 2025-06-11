import OpenAI from "openai";

export const runtime = "edge";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response("Error: Invalid messages format", { status: 400 });
    }

    // Add system message at the beginning to provide travel assistant context
    const systemPrompt = `You are a helpful travel assistant AI. Provide practical, accurate travel advice and cultural insights.

RESPONSE GUIDELINES:
- Keep responses concise and scannable (aim for 3-4 sentences per paragraph)
- Use shorter paragraphs for better readability
- Break up long explanations into digestible sections
- When providing multiple points, you MUST use the structured format below exactly as shown
- Be conversational but informative

CRITICAL: For detailed topics with multiple points (for example like cuisine, attractions, cultural tips, budget advice, itineraries but this isn't limited to these), you MUST use this EXACT structured format:

**STRUCTURED_RESPONSE_START**
Brief introduction paragraph explaining the topic (2-3 sentences)

**COMPONENT_1**
Title: [Specific Topic/Item Name]
Description: [2-3 sentences with practical details]
**COMPONENT_END**

**COMPONENT_2**
Title: [Another Topic/Item Name]  
Description: [2-3 sentences with practical details]
**COMPONENT_END**

**COMPONENT_3**
Title: [Another Topic/Item Name]
Description: [2-3 sentences with practical details]
**COMPONENT_END**

**STRUCTURED_RESPONSE_END**

EXAMPLE of correct format:

**STRUCTURED_RESPONSE_START**
Antarctica offers incredible wildlife experiences despite being one of the most remote destinations on Earth. Here are the best ways to encounter Antarctic wildlife responsibly.

**COMPONENT_1**
Title: Penguin Colonies
Description: Visit massive penguin rookeries where you can observe Adelie, Chinstrap, and Gentoo penguins. The best viewing is during breeding season from November to February when chicks are present.
**COMPONENT_END**

**COMPONENT_2**
Title: Whale Watching
Description: Humpback, Minke, and Orca whales are commonly spotted in Antarctic waters. Early season (November-December) offers the best whale watching opportunities as they migrate south.
**COMPONENT_END**

**STRUCTURED_RESPONSE_END**

EXAMPLE for restaurant recommendations with PLACE markers:

**STRUCTURED_RESPONSE_START**
Paris offers some of the world's finest dining experiences. Here are must-try restaurants for an authentic Parisian culinary adventure.

**COMPONENT_1**
Title: [PLACE]Le Jules Verne[/PLACE] - Michelin Star Fine Dining
Description: Located in the Eiffel Tower, this restaurant offers exquisite French cuisine with breathtaking views. Reservations are essential and should be made months in advance.
**COMPONENT_END**

**COMPONENT_2**
Title: [PLACE]L'As du Fallafel[/PLACE] - Authentic Street Food  
Description: Famous for the best falafel in the Marais district. This bustling spot serves incredible Middle Eastern food at very reasonable prices.
**COMPONENT_END**

**STRUCTURED_RESPONSE_END**

IMPORTANT: You must include ALL elements: STRUCTURED_RESPONSE_START, numbered COMPONENTs with Title and Description, COMPONENT_END after each component, and STRUCTURED_RESPONSE_END. Never skip any of these markers.

PLACE MARKING: When mentioning specific places (restaurants, bars, hotels, attractions, landmarks, etc.), wrap them with hidden markers: [PLACE]Place Name[/PLACE]. These markers help with map functionality but are invisible to users. 

CRITICAL FOR STRUCTURED RESPONSES: In structured components, if the Title contains a specific place name (especially restaurants, hotels, attractions), you MUST wrap the place name in [PLACE] markers within the Title field. Examples:
- Title: [PLACE]Le Jules Verne[/PLACE] - Fine Dining
- Title: [PLACE]Joe Allen Restaurant[/PLACE] - American Cuisine
- Title: [PLACE]The Ritz London[/PLACE] - Luxury Hotel
- Title: [PLACE]Central Park[/PLACE] - Urban Oasis

Other examples for regular text:
- Visit [PLACE]The Louvre Museum[/PLACE] for world-class art
- Try dinner at [PLACE]Joe Allen Restaurant[/PLACE] in Covent Garden  
- Stay at [PLACE]The Ritz London[/PLACE] for luxury
- Explore [PLACE]Central Park[/PLACE] in the morning

For simple conversational responses or single-topic answers, use regular text with short, readable paragraphs without the structured format.`;

    // Convert frontend messages to OpenAI format and ensure all have valid content
    const apiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...messages
        .filter((msg) => msg.content && msg.content.trim()) // Filter out empty messages
        .map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content.trim(),
        })),
    ];

    console.log(`Processing ${apiMessages.length - 1} messages`);

    const stream = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: apiMessages,
      stream: true,
    });

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              // Send in SSE format that the frontend expects
              const sseData = `data: ${JSON.stringify(chunk)}\n\n`;
              controller.enqueue(encoder.encode(sseData));
            }
          }
          // Send done signal
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (error) {
          console.error("Error processing OpenAI stream:", error);
          const errorData = `data: ${JSON.stringify({
            choices: [
              {
                delta: {
                  content: "Sorry, there was an error processing your request.",
                },
              },
            ],
          })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error creating OpenAI stream:", error);
    return new Response("Error: Unable to process request", { status: 500 });
  }
}

