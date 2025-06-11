import { useState, useRef, useEffect } from "react";

export interface UserPreferences {
  country: string;
  continent: string;
  destination: string;
}

export const useChat = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isStreamingStructured, setIsStreamingStructured] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [structuredLoading, setStructuredLoading] = useState<
    Record<number, boolean>
  >({});
  const [messageSuggestions, setMessageSuggestions] = useState<
    Record<number, string[]>
  >({});
  const [userPreferences, setUserPreferences] =
    useState<UserPreferences | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Scroll behavior state
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);

  // Smart scroll logic
  const scrollToBottom = (force = false) => {
    if (!endRef.current) return;

    if (force || !isUserScrolledUp) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
      setHasNewMessages(false);
    }
  };

  const checkScrollPosition = () => {
    if (!chatContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100; // 100px threshold

    setIsUserScrolledUp(!isNearBottom);

    if (isNearBottom) {
      setHasNewMessages(false);
    }
  };

  // Handle scroll events
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", checkScrollPosition);
    return () => container.removeEventListener("scroll", checkScrollPosition);
  }, []);

  // Handle new messages and auto-scroll
  useEffect(() => {
    const currentMessageCount = messages.length;
    const hadNewMessage = currentMessageCount > lastMessageCountRef.current;
    lastMessageCountRef.current = currentMessageCount;

    if (hadNewMessage) {
      if (isUserScrolledUp) {
        // User is scrolled up, show new message indicator instead of auto-scrolling
        setHasNewMessages(true);
      } else {
        // User is at bottom, auto-scroll to new content
        setTimeout(() => scrollToBottom(), 100);
      }
    }
  }, [messages, isUserScrolledUp]);

  const generateWelcomeSuggestions = (prefs: UserPreferences): string[] => {
    return [
      `What's the best time to visit ${prefs.destination}?`,
      `Tell me about must-see attractions in ${prefs.country}`,
      `What's the local cuisine like in ${prefs.destination}?`,
      `Cultural tips for visiting ${prefs.country}`,
      `Budget travel advice for ${prefs.continent}`,
      `What should I pack for a trip to ${prefs.destination}?`,
    ];
  };

  const generateContextualSuggestions = async (
    lastMessage: string,
    prefs: UserPreferences
  ): Promise<string[]> => {
    try {
      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiResponse: lastMessage,
          userPreferences: prefs,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate suggestions");
      }

      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      console.error("Error generating contextual suggestions:", error);

      // Fallback to simple contextual suggestions
      return [
        `Hidden gems in ${prefs.destination}`,
        `Local experiences in ${prefs.country}`,
        `Best time to visit ${prefs.destination}`,
        `Cultural tips for ${prefs.country}`,
        `Transportation in ${prefs.destination}`,
        `Budget advice for ${prefs.continent}`,
      ];
    }
  };

  const addWelcomeMessage = (prefs: UserPreferences) => {
    const welcomeMessage = `Hello! I see you're favourite country is ${prefs.country}, your favourite continent is ${prefs.continent} and your favourite destination is ${prefs.destination}. I'm here to help you with travel advice, cultural insights, and destination recommendations. What would you like to know?`;
    setMessages([welcomeMessage]);
    setUserPreferences(prefs);

    // Generate welcome suggestions with loading state
    setSuggestionsLoading(true);
    setTimeout(() => {
      const welcomeSuggestions = generateWelcomeSuggestions(prefs);
      setSuggestions(welcomeSuggestions);

      // Store suggestions for the welcome message (index 0)
      setMessageSuggestions({ 0: welcomeSuggestions });
      setSuggestionsLoading(false);
    }, 500); // Small delay to show loading state
  };

  const isStructuredResponse = (text: string): boolean => {
    return text.includes("**STRUCTURED_RESPONSE_START**");
  };

  const isStructuredResponseComplete = (text: string): boolean => {
    return (
      text.includes("**STRUCTURED_RESPONSE_START**") &&
      text.includes("**STRUCTURED_RESPONSE_END**")
    );
  };

  const getStreamingDisplayText = (
    text: string,
    messageIndex: number
  ): string => {
    if (isStructuredResponse(text)) {
      if (isStructuredResponseComplete(text)) {
        // Complete structured response - clear loading state and return content
        setStructuredLoading((prev) => {
          const updated = { ...prev };
          delete updated[messageIndex];
          return updated;
        });
        setIsStreamingStructured(false);
        return text;
      } else {
        // Incomplete structured response - set loading state and return partial content
        setStructuredLoading((prev) => ({ ...prev, [messageIndex]: true }));
        setIsStreamingStructured(true);
        return text; // Return the partial content instead of loading text
      }
    }
    return text;
  };

  const sendMessage = async (messageText?: string) => {
    const messageToSend = messageText || input;
    if (!messageToSend.trim()) return;

    // Add user message immediately
    setMessages((prev) => [...prev, messageToSend]);
    if (!messageText) setInput("");
    setIsStreaming(true);

    try {
      // Prepare messages for API call - only include non-empty messages
      const currentMessages = [...messages, messageToSend];
      const apiMessages = currentMessages
        .filter((msg) => msg && msg.trim()) // Filter out any empty/null messages
        .map((msg, i) => ({
          role: i % 2 === 0 ? "assistant" : "user",
          content: msg.trim(),
        }));

      const response = await fetch("/api/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
        }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      let assistantMessage = "";

      // Add empty assistant message placeholder
      setMessages((prev) => [...prev, ""]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantMessage += content;

                // Update the last message (assistant message) using functional update
                setMessages((prev) => {
                  const updated = [...prev];
                  const messageIndex = updated.length - 1; // Index of the assistant message being updated

                  // Get the display text (either loading state or actual content)
                  const displayText = getStreamingDisplayText(
                    assistantMessage,
                    messageIndex
                  );

                  updated[updated.length - 1] = displayText;
                  return updated;
                });
              }
            } catch (e) {
              console.error("Error parsing chunk:", e);
            }
          }
        }
      }

      // CRITICAL: Final update with a small delay to ensure proper rendering
      setTimeout(() => {
        setMessages((prev) => {
          const updated = [...prev];
          const messageIndex = updated.length - 1;

          // Clear any structured loading state for this message
          setStructuredLoading((prevLoading) => {
            const updatedLoading = { ...prevLoading };
            delete updatedLoading[messageIndex];
            return updatedLoading;
          });

          // Ensure we're setting the actual complete message
          updated[updated.length - 1] = assistantMessage;
          return updated;
        });
      }, 100);

      // Generate contextual suggestions after AI response
      if (userPreferences) {
        setSuggestionsLoading(true);
        try {
          const contextualSuggestions = await generateContextualSuggestions(
            assistantMessage,
            userPreferences
          );
          setSuggestions(contextualSuggestions);

          // Store suggestions for this specific AI message (current messages length - 1)
          const aiMessageIndex = messages.length + 1; // +1 because we added user message already
          setMessageSuggestions((prev) => ({
            ...prev,
            [aiMessageIndex]: contextualSuggestions,
          }));
        } finally {
          setSuggestionsLoading(false);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        "Sorry, I encountered an error. Please try again.",
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return {
    messages,
    input,
    setInput,
    isStreaming,
    isStreamingStructured,
    suggestions,
    suggestionsLoading,
    structuredLoading,
    messageSuggestions,
    sendMessage,
    handleKeyPress,
    addWelcomeMessage,
    endRef,
    chatContainerRef,
    hasNewMessages,
    scrollToBottom,
  };
};
