import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "../app/page";

// Mock fetch for integration tests
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("Travel Assistant Integration Tests", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("completes full user journey from preferences to chat", async () => {
    const user = userEvent.setup();

    // Mock streaming response
    const mockStream = {
      getReader: () => ({
        read: jest
          .fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode("Great choice!"),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(" France is beautiful."),
          })
          .mockResolvedValue({ done: true, value: undefined }),
      }),
    };

    mockFetch.mockImplementation((url) => {
      if (url === "/api/stream") {
        return Promise.resolve({
          ok: true,
          body: mockStream,
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

    // Step 1: Verify initial state
    expect(
      screen.getByText("Welcome to Travel Assistant! ✈️")
    ).toBeInTheDocument();

    // Step 2: Fill out preferences form
    await user.type(screen.getByLabelText("Favorite Country"), "France");
    await user.selectOptions(
      screen.getByLabelText("Favorite Continent"),
      "Europe"
    );
    await user.type(screen.getByLabelText("Favorite Destination"), "Paris");

    // Step 3: Submit preferences
    await user.click(screen.getByRole("button", { name: "Start Chat" }));

    // Step 4: Verify chat interface appears with welcome message
    await waitFor(() => {
      expect(
        screen.getByText(/Hello! I see you're favourite country is France/)
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Type a message")).toBeInTheDocument();
    });

    // Step 5: Send a message
    const messageInput = screen.getByPlaceholderText("Type a message");
    await user.type(messageInput, "Tell me about French cuisine");
    await user.click(screen.getByRole("button", { name: "Send" }));

    // Step 6: Verify API call was made with preferences
    expect(mockFetch).toHaveBeenCalledWith("/api/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "assistant",
            content:
              "Hello! I see you're favourite country is France, your favourite continent is Europe and your favourite destination is Paris. I'm here to help you with travel advice, cultural insights, and destination recommendations. What would you like to know?",
          },
          {
            role: "user",
            content: "Tell me about French cuisine",
          },
        ],
      }),
    });

    // Step 7: Verify input cleared after sending
    expect(messageInput).toHaveValue("");
  });

  it("handles keyboard shortcuts in chat", async () => {
    const user = userEvent.setup();

    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/stream") {
        return Promise.resolve({
          ok: true,
          body: {
            getReader: () => ({
              read: jest.fn().mockResolvedValue({ done: true }),
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

    // Complete preferences setup
    await user.type(screen.getByLabelText("Favorite Country"), "Italy");
    await user.selectOptions(
      screen.getByLabelText("Favorite Continent"),
      "Europe"
    );
    await user.type(screen.getByLabelText("Favorite Destination"), "Rome");
    await user.click(screen.getByRole("button", { name: "Start Chat" }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Type a message")).toBeInTheDocument();
    });

    // Test Enter key to send message
    const messageInput = screen.getByPlaceholderText("Type a message");
    await user.type(messageInput, "Hello");
    await user.keyboard("{Enter}");

    expect(mockFetch).toHaveBeenCalled();
  });

  it("maintains conversation context", async () => {
    const user = userEvent.setup();

    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/stream") {
        return Promise.resolve({
          ok: true,
          body: {
            getReader: () => ({
              read: jest.fn().mockResolvedValue({ done: true }),
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

    // Setup preferences
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

    // Send multiple messages
    const messageInput = screen.getByPlaceholderText("Type a message");

    await user.type(messageInput, "First message");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await user.type(messageInput, "Second message");
    await user.click(screen.getByRole("button", { name: "Send" }));

    // Verify both stream and suggestions APIs are called - expect 4 total calls (2 streams + 2 suggestions)
    expect(mockFetch).toHaveBeenCalledTimes(4);

    // Verify the first stream API call
    expect(mockFetch).toHaveBeenNthCalledWith(1, "/api/stream", {
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
            content: "First message",
          },
        ],
      }),
    });

    // Verify suggestions API is called after first message
    expect(mockFetch).toHaveBeenNthCalledWith(2, "/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aiResponse: "",
        userPreferences: {
          country: "Japan",
          continent: "Asia",
          destination: "Tokyo",
        },
      }),
    });
  });

  it("handles form validation properly", async () => {
    const user = userEvent.setup();
    render(<Home />);

    // Try to submit with missing fields
    const submitButton = screen.getByRole("button", {
      name: "Start Chat",
    });

    // Should not proceed without all fields filled
    await user.click(submitButton);
    expect(
      screen.getByText("Welcome to Travel Assistant! ✈️")
    ).toBeInTheDocument();

    // Fill only country
    await user.type(screen.getByLabelText("Favorite Country"), "Brazil");
    await user.click(submitButton);
    expect(
      screen.getByText("Welcome to Travel Assistant! ✈️")
    ).toBeInTheDocument();

    // Fill country and continent
    await user.selectOptions(
      screen.getByLabelText("Favorite Continent"),
      "South America"
    );
    await user.click(submitButton);
    expect(
      screen.getByText("Welcome to Travel Assistant! ✈️")
    ).toBeInTheDocument();

    // Fill all fields
    await user.type(
      screen.getByLabelText("Favorite Destination"),
      "Rio de Janeiro"
    );
    await user.click(submitButton);

    // Should now proceed to chat
    await waitFor(() => {
      expect(
        screen.queryByText("Welcome to Travel Assistant! ✈️")
      ).not.toBeInTheDocument();
    });
  });
});
