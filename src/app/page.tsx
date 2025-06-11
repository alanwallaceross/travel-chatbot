"use client";
import { useState } from "react";
import { useChat, UserPreferences } from "../hooks/useChat";
import { detectPreferenceChanges } from "../services/preferenceDetection";
import { OnboardingForm } from "../components/OnboardingForm";
import { ChatHeader } from "../components/ChatHeader";
import { StreamingIndicators } from "../components/StreamingIndicators";
import { ChatInterface } from "../components/ChatInterface";
import { PreferencesModal } from "../components/PreferencesModal";

export default function Home() {
  const [showChat, setShowChat] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    country: "",
    continent: "",
    destination: "",
  });
  const [expandedMessages, setExpandedMessages] = useState<
    Record<number, boolean>
  >({});

  const {
    messages,
    input,
    setInput,
    isStreaming,
    isStreamingStructured,
    suggestionsLoading,
    structuredLoading,
    messageSuggestions,
    sendMessage,
    addWelcomeMessage,
    endRef,
    chatContainerRef,
    hasNewMessages,
    scrollToBottom,
  } = useChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !preferences.country ||
      !preferences.continent ||
      !preferences.destination
    ) {
      alert("Please fill in all fields");
      return;
    }

    addWelcomeMessage(preferences);
    setShowChat(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleMessageWithPreferenceDetection = (message: string) => {
    if (!message.trim()) return;

    // Check for preference changes in the message
    const detectedChanges = detectPreferenceChanges(message);

    if (detectedChanges) {
      // Update preferences if changes detected
      const newPreferences = { ...preferences, ...detectedChanges };
      setPreferences(newPreferences);

      // Create a modified message that includes the preference update context
      const enhancedMessage = `${message}

[System: I've detected and updated your travel preferences - ${
        detectedChanges.country ? `Country: ${detectedChanges.country}` : ""
      }${
        detectedChanges.continent
          ? `, Continent: ${detectedChanges.continent}`
          : ""
      }${
        detectedChanges.destination
          ? `, Destination: ${detectedChanges.destination}`
          : ""
      }. Please provide advice based on these updated preferences.]`;

      // Send the enhanced message
      sendMessage(enhancedMessage);
    } else {
      // No preference changes detected, send message normally
      sendMessage(message);
    }

    // Clear input
    setInput("");
  };

  const handleToggleExpanded = (messageIndex: number, expanded: boolean) => {
    setExpandedMessages((prev) => ({
      ...prev,
      [messageIndex]: expanded,
    }));
  };

  const handlePreferencesUpdate = (newPreferences: UserPreferences) => {
    setPreferences(newPreferences);
    setShowPreferences(false);

    // Send a message to trigger AI response about the preference update
    const updateMessage = `My travel preferences have changed. My favorite country is now ${newPreferences.country}, continent is ${newPreferences.continent}, and destination is ${newPreferences.destination}. Can you give me some travel advice based on my updated preferences?`;

    sendMessage(updateMessage);
  };

  return (
    <div className="fixed bottom-6 right-6 w-[480px] h-[600px] flex flex-col rounded-lg shadow-lg border bg-white dark:bg-gray-900">
      {/* Chat Header */}
      {showChat && (
        <>
          <ChatHeader onSettingsClick={() => setShowPreferences(true)} />
          <StreamingIndicators
            suggestionsLoading={suggestionsLoading}
            isStreaming={isStreaming}
            isStreamingStructured={isStreamingStructured}
          />
        </>
      )}

      {!showChat ? (
        <div className="flex-1 p-4 overflow-y-auto space-y-3 text-sm relative">
          <OnboardingForm
            preferences={preferences}
            setPreferences={setPreferences}
            onSubmit={handleSubmit}
          />
        </div>
      ) : (
        <ChatInterface
          messages={messages}
          structuredLoading={structuredLoading}
          isStreaming={isStreaming}
          isStreamingStructured={isStreamingStructured}
          suggestionsLoading={suggestionsLoading}
          messageSuggestions={messageSuggestions}
          expandedMessages={expandedMessages}
          hasNewMessages={hasNewMessages}
          chatContainerRef={chatContainerRef}
          endRef={endRef}
          input={input}
          setInput={setInput}
          onSuggestionClick={handleSuggestionClick}
          onToggleExpanded={handleToggleExpanded}
          onSendMessage={handleMessageWithPreferenceDetection}
          scrollToBottom={scrollToBottom}
        />
      )}

      <PreferencesModal
        show={showPreferences}
        preferences={preferences}
        setPreferences={setPreferences}
        onClose={() => setShowPreferences(false)}
        onUpdate={handlePreferencesUpdate}
      />
    </div>
  );
}

