import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "../app/page";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock scrollIntoView
Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
  value: jest.fn(),
  writable: true,
});

describe("Travel Assistant - Core Features", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  test("renders initial preferences form", () => {
    render(<Home />);

    expect(
      screen.getByText("Welcome to Travel Assistant! ✈️")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Favorite Country")).toBeInTheDocument();
    expect(screen.getByLabelText("Favorite Continent")).toBeInTheDocument();
    expect(screen.getByLabelText("Favorite Destination")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start Chat" })
    ).toBeInTheDocument();
  });

  test("form validates required fields", async () => {
    const user = userEvent.setup();
    render(<Home />);

    // Try to submit empty form
    await user.click(screen.getByRole("button", { name: "Start Chat" }));

    // Should still show the welcome message (form didn't submit)
    expect(
      screen.getByText("Welcome to Travel Assistant! ✈️")
    ).toBeInTheDocument();
  });

  test("continent dropdown has all options", () => {
    render(<Home />);

    const continents = [
      "Select a continent",
      "Africa",
      "Antarctica",
      "Asia",
      "Europe",
      "North America",
      "Oceania",
      "South America",
    ];

    continents.forEach((continent) => {
      expect(
        screen.getByRole("option", { name: continent })
      ).toBeInTheDocument();
    });
  });

  test("submits preferences and shows chat interface with suggestions", async () => {
    const user = userEvent.setup();
    render(<Home />);

    // Fill out form
    await user.type(screen.getByLabelText("Favorite Country"), "Italy");
    await user.selectOptions(
      screen.getByLabelText("Favorite Continent"),
      "Europe"
    );
    await user.type(screen.getByLabelText("Favorite Destination"), "Rome");

    // Submit
    await user.click(screen.getByRole("button", { name: "Start Chat" }));

    // Check chat interface appears
    await waitFor(() => {
      expect(
        screen.queryByText("Welcome to Travel Assistant! ✈️")
      ).not.toBeInTheDocument();
      expect(
        screen.getByText(/Hello! I see you're favourite country is Italy/)
      ).toBeInTheDocument();
    });

    // Check message input is present
    const messageInput = screen.getByPlaceholderText("Type a message");
    expect(messageInput).toBeInTheDocument();

    // Check suggestions are displayed - wait for them to load after the 500ms delay
    await waitFor(() => {
      expect(screen.getByText("Suggested questions:")).toBeInTheDocument();
    });

    expect(
      screen.getByText("What's the best time to visit Rome?")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Tell me about must-see attractions in Italy")
    ).toBeInTheDocument();
    expect(
      screen.getByText("What's the local cuisine like in Rome?")
    ).toBeInTheDocument();
  });

  test("sends message with preferences", async () => {
    const user = userEvent.setup();

    // Mock successful response
    mockFetch.mockImplementation((url) => {
      if (url === "/api/stream") {
        return Promise.resolve({
          ok: true,
          body: {
            getReader: () => ({
              read: jest
                .fn()
                .mockResolvedValue({ done: true, value: undefined }),
            }),
          },
        });
      } else if (url === "/api/suggestions") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ suggestions: [] }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ suggestions: [] }),
      });
    });

    render(<Home />);

    // Complete preferences
    await user.type(screen.getByLabelText("Favorite Country"), "Japan");
    await user.selectOptions(
      screen.getByLabelText("Favorite Continent"),
      "Asia"
    );
    await user.type(screen.getByLabelText("Favorite Destination"), "Tokyo");
    await user.click(screen.getByRole("button", { name: "Start Chat" }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Type a message")).toBeInTheDocument();
    });

    // Send message
    const input = screen.getByPlaceholderText("Type a message");
    await user.type(input, "Tell me about sushi");
    await user.click(screen.getByRole("button", { name: "Send" }));

    // Verify API call
    expect(mockFetch).toHaveBeenCalledWith("/api/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "assistant",
            content:
              "Hello! I see you're favourite country is Japan, your favourite continent is Asia and your favourite destination is Tokyo. I'm here to help you with travel advice, cultural insights, and destination recommendations. What would you like to know?",
          },
          {
            role: "user",
            content: "Tell me about sushi",
          },
        ],
      }),
    });

    // Input should be cleared
    expect(input).toHaveValue("");
  });

  test("handles enter key for sending messages", async () => {
    const user = userEvent.setup();

    mockFetch.mockImplementation((url) => {
      if (url === "/api/stream") {
        return Promise.resolve({
          ok: true,
          body: {
            getReader: () => ({
              read: jest
                .fn()
                .mockResolvedValue({ done: true, value: undefined }),
            }),
          },
        });
      } else if (url === "/api/suggestions") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ suggestions: [] }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ suggestions: [] }),
      });
    });

    render(<Home />);

    // Complete setup
    await user.type(screen.getByLabelText("Favorite Country"), "France");
    await user.selectOptions(
      screen.getByLabelText("Favorite Continent"),
      "Europe"
    );
    await user.type(screen.getByLabelText("Favorite Destination"), "Paris");
    await user.click(screen.getByRole("button", { name: "Start Chat" }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Type a message")).toBeInTheDocument();
    });

    // Send with Enter key
    const input = screen.getByPlaceholderText("Type a message");
    await user.type(input, "Bonjour!");
    await user.keyboard("{Enter}");

    expect(mockFetch).toHaveBeenCalled();
  });

  test("prevents sending empty messages", async () => {
    const user = userEvent.setup();
    render(<Home />);

    // Complete setup
    await user.type(screen.getByLabelText("Favorite Country"), "Spain");
    await user.selectOptions(
      screen.getByLabelText("Favorite Continent"),
      "Europe"
    );
    await user.type(screen.getByLabelText("Favorite Destination"), "Barcelona");
    await user.click(screen.getByRole("button", { name: "Start Chat" }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Type a message")).toBeInTheDocument();
    });

    // Try to send empty message
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(mockFetch).not.toHaveBeenCalled();

    // Try to send whitespace
    const input = screen.getByPlaceholderText("Type a message");
    await user.type(input, "   ");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("form has proper accessibility attributes", () => {
    render(<Home />);

    expect(screen.getByLabelText("Favorite Country")).toBeInTheDocument();
    expect(screen.getByLabelText("Favorite Continent")).toBeInTheDocument();
    expect(screen.getByLabelText("Favorite Destination")).toBeInTheDocument();
  });

  test("handles suggestion clicks", async () => {
    // Mock the fetch to handle both stream and suggestions APIs
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === "/api/stream") {
        return Promise.resolve({
          body: {
            getReader: () => ({
              read: jest
                .fn()
                .mockResolvedValueOnce({
                  done: false,
                  value: new TextEncoder().encode(
                    'data: {"choices":[{"delta":{"content":"Great question!"}}]}\n'
                  ),
                })
                .mockResolvedValueOnce({
                  done: true,
                }),
            }),
          },
        });
      } else if (url === "/api/suggestions") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              suggestions: [
                "Hidden gems in Tokyo",
                "Local experiences in Japan",
                "Best time to visit Tokyo",
                "Cultural tips for Japan",
                "Transportation in Tokyo",
                "Budget advice for Asia",
              ],
            }),
        });
      }
      // Default fallback
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ suggestions: [] }),
      });
    });

    render(<Home />);

    // Fill form and start chat
    await userEvent.type(screen.getByLabelText("Favorite Country"), "Japan");
    await userEvent.selectOptions(
      screen.getByLabelText("Favorite Continent"),
      "Asia"
    );
    await userEvent.type(
      screen.getByLabelText("Favorite Destination"),
      "Tokyo"
    );
    await userEvent.click(screen.getByRole("button", { name: "Start Chat" }));

    // Wait for welcome suggestions to appear
    await waitFor(() => {
      expect(
        screen.getByText("What's the best time to visit Tokyo?")
      ).toBeInTheDocument();
    });

    // Click a suggestion - use the button element specifically
    const suggestionButton = screen.getByRole("button", {
      name: "What's the best time to visit Tokyo?",
    });
    await userEvent.click(suggestionButton);

    // Verify the suggestion message appears in the chat
    await waitFor(() => {
      const messageElements = screen.getAllByText(
        "What's the best time to visit Tokyo?"
      );
      expect(messageElements.length).toBeGreaterThan(1); // Should appear both as button and message
    });

    // Wait for AI response and new contextual suggestions
    await waitFor(() => {
      expect(screen.getByText("Continue exploring:")).toBeInTheDocument();
    });

    // Verify fetch was called
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/stream",
      expect.any(Object)
    );
  });

  test("shows contextual suggestions after each AI response", async () => {
    // Mock the main chat API
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === "/api/stream") {
        return Promise.resolve({
          body: {
            getReader: () => ({
              read: jest
                .fn()
                .mockResolvedValueOnce({
                  done: false,
                  value: new TextEncoder().encode(
                    'data: {"choices":[{"delta":{"content":"Here are some budget travel tips: Choose countries wisely, as some destinations are more expensive than others. Look for budget accommodations like hostels."}}]}\n'
                  ),
                })
                .mockResolvedValueOnce({
                  done: true,
                }),
            }),
          },
        });
      } else if (url === "/api/suggestions") {
        // Mock the suggestions API to return relevant suggestions
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              suggestions: [
                "Which Africa countries are most budget-friendly?",
                "Cost comparison between different Africa destinations",
                "Best budget accommodations in Nairobi",
                "How to find cheap places to stay in Kenya",
                "Cheapest ways to get around Kenya",
                "Street food safety tips for Kenya",
              ],
            }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    render(<Home />);

    // Fill form and start chat
    await userEvent.type(screen.getByLabelText("Favorite Country"), "Kenya");
    await userEvent.selectOptions(
      screen.getByLabelText("Favorite Continent"),
      "Africa"
    );
    await userEvent.type(
      screen.getByLabelText("Favorite Destination"),
      "Nairobi"
    );
    await userEvent.click(screen.getByRole("button", { name: "Start Chat" }));

    // Send a budget-related message
    const messageInput = screen.getByPlaceholderText("Type a message");
    await userEvent.type(messageInput, "Budget travel advice for Africa");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    // Wait for AI response and contextual suggestions
    await waitFor(() => {
      expect(screen.getByText("Continue exploring:")).toBeInTheDocument();
    });

    // Should show AI-generated suggestions based on the response content
    await waitFor(() => {
      expect(
        screen.getByText("Which Africa countries are most budget-friendly?")
      ).toBeInTheDocument();
    });

    // Should also show suggestions about accommodations since AI mentioned hostels
    await waitFor(() => {
      expect(
        screen.getByText("Best budget accommodations in Nairobi")
      ).toBeInTheDocument();
    });
  });

  test("clears suggestions during response and shows new ones after", async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === "/api/stream") {
        return Promise.resolve({
          body: {
            getReader: () => ({
              read: jest
                .fn()
                .mockResolvedValueOnce({
                  done: false,
                  value: new TextEncoder().encode(
                    'data: {"choices":[{"delta":{"content":"Hello! Here is some travel advice."}}]}\n'
                  ),
                })
                .mockResolvedValueOnce({
                  done: true,
                }),
            }),
          },
        });
      } else if (url === "/api/suggestions") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              suggestions: [
                "Hidden gems in Paris",
                "Local experiences in France",
                "Best time to visit Paris",
                "Cultural tips for France",
                "Transportation in Paris",
                "Budget advice for Europe",
              ],
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ suggestions: [] }),
      });
    });

    render(<Home />);

    // Fill form and start chat
    await userEvent.type(screen.getByLabelText("Favorite Country"), "France");
    await userEvent.selectOptions(
      screen.getByLabelText("Favorite Continent"),
      "Europe"
    );
    await userEvent.type(
      screen.getByLabelText("Favorite Destination"),
      "Paris"
    );
    await userEvent.click(screen.getByRole("button", { name: "Start Chat" }));

    // Wait for welcome suggestions to appear
    await waitFor(() => {
      expect(screen.getByText("Suggested questions:")).toBeInTheDocument();
    });

    // Send a regular message
    const messageInput = screen.getByPlaceholderText("Type a message");
    await userEvent.type(messageInput, "Hello!");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    // Wait for new contextual suggestions to appear after AI response
    await waitFor(() => {
      expect(screen.getByText("Continue exploring:")).toBeInTheDocument();
    });
  });

  test("renders structured responses correctly", async () => {
    const structuredResponse = `**STRUCTURED_RESPONSE_START**
Here are some great local cuisines to try:

**COMPONENT_1**
Title: Croissants
Description: Flaky, buttery pastries perfect for breakfast
**COMPONENT_END**

**COMPONENT_2**
Title: Escargot
Description: Delicious snails cooked in garlic and herbs
**COMPONENT_END**

**STRUCTURED_RESPONSE_END**`;

    (global.fetch as jest.Mock).mockResolvedValue({
      body: {
        getReader: () => ({
          read: jest
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(
                `data: ${JSON.stringify({
                  choices: [{ delta: { content: structuredResponse } }],
                })}\n\n`
              ),
            })
            .mockResolvedValueOnce({
              done: true,
            }),
        }),
      },
    });

    render(<Home />);

    // Fill form and start chat
    await userEvent.type(screen.getByLabelText("Favorite Country"), "France");
    await userEvent.selectOptions(
      screen.getByLabelText("Favorite Continent"),
      "Europe"
    );
    await userEvent.type(
      screen.getByLabelText("Favorite Destination"),
      "Paris"
    );
    await userEvent.click(screen.getByRole("button", { name: "Start Chat" }));

    // Ask a cuisine question
    const messageInput = screen.getByPlaceholderText("Type a message");
    await userEvent.type(messageInput, "What's the local cuisine like?");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    // Wait for structured response to appear
    await waitFor(() => {
      expect(
        screen.getByText("Here are some great local cuisines to try:")
      ).toBeInTheDocument();
    });

    // Check that components are rendered
    await waitFor(() => {
      expect(screen.getByText("Croissants")).toBeInTheDocument();
      expect(screen.getByText("Escargot")).toBeInTheDocument();
      expect(
        screen.getByText("Flaky, buttery pastries perfect for breakfast")
      ).toBeInTheDocument();
    });
  });

  test("makes long responses expandable for better UX", async () => {
    const longResponse =
      "This is the first sentence of a very long response. This is the second sentence that continues the explanation. This is the third sentence that adds more detail. This is the fourth sentence that makes the response quite lengthy. This is the fifth sentence that definitely exceeds the chunk limit. This is the sixth sentence that should be hidden by default. This is the seventh sentence in the expandable section.";

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === "/api/stream") {
        return Promise.resolve({
          body: {
            getReader: () => ({
              read: jest
                .fn()
                .mockResolvedValueOnce({
                  done: false,
                  value: new TextEncoder().encode(
                    `data: ${JSON.stringify({
                      choices: [{ delta: { content: longResponse } }],
                    })}\n\n`
                  ),
                })
                .mockResolvedValueOnce({
                  done: true,
                }),
            }),
          },
        });
      } else if (url === "/api/suggestions") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              suggestions: [
                "Suggestion 1",
                "Suggestion 2",
                "Suggestion 3",
                "Suggestion 4",
                "Suggestion 5",
                "Suggestion 6",
              ],
            }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    render(<Home />);

    // Fill form and start chat
    await userEvent.type(screen.getByLabelText("Favorite Country"), "France");
    await userEvent.selectOptions(
      screen.getByLabelText("Favorite Continent"),
      "Europe"
    );
    await userEvent.type(
      screen.getByLabelText("Favorite Destination"),
      "Paris"
    );
    await userEvent.click(screen.getByRole("button", { name: "Start Chat" }));

    // Send a message that will get a long response
    const messageInput = screen.getByPlaceholderText("Type a message");
    await userEvent.type(
      messageInput,
      "Tell me everything about French culture"
    );
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    // Wait for the response
    await waitFor(() => {
      expect(
        screen.getByText(/This is the first sentence/)
      ).toBeInTheDocument();
    });

    // Should show "Show more" button for long responses
    await waitFor(() => {
      expect(screen.getByText("Show more")).toBeInTheDocument();
    });

    // Click "Show more" to expand
    await userEvent.click(screen.getByText("Show more"));

    // Should now show additional content and "Show less" button
    await waitFor(() => {
      expect(screen.getByText("Show less")).toBeInTheDocument();
      expect(screen.getByText(/sixth sentence/)).toBeInTheDocument();
    });

    // Click "Show less" to collapse
    await userEvent.click(screen.getByText("Show less"));

    // Should hide additional content and show "Show more" again
    await waitFor(() => {
      expect(screen.getByText("Show more")).toBeInTheDocument();
      expect(screen.queryByText(/sixth sentence/)).not.toBeInTheDocument();
    });
  });
});
