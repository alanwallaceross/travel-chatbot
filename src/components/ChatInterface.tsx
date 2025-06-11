import React from "react";
import {
  parseStructuredResponse,
  stripPlaceMarkers,
} from "../utils/messageParser";
import { ExpandableText } from "./ExpandableText";
import { StructuredMessageComponent } from "./StructuredMessageComponent";
import {
  EnhancedStructuredLoadingComponent,
  TypingIndicator,
  SuggestionsLoadingComponent,
} from "./LoadingComponents";

interface ChatInterfaceProps {
  messages: string[];
  structuredLoading: Record<number, boolean>;
  isStreaming: boolean;
  isStreamingStructured: boolean;
  suggestionsLoading: boolean;
  messageSuggestions: Record<number, string[]>;
  expandedMessages: Record<number, boolean>;
  hasNewMessages: boolean;
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
  endRef: React.RefObject<HTMLDivElement | null>;
  input: string;
  setInput: (input: string) => void;
  onSuggestionClick: (suggestion: string) => void;
  onToggleExpanded: (messageIndex: number, expanded: boolean) => void;
  onSendMessage: (message: string) => void;
  scrollToBottom: (force?: boolean) => void;
}

export const ChatInterface = ({
  messages,
  structuredLoading,
  isStreaming,
  isStreamingStructured,
  suggestionsLoading,
  messageSuggestions,
  expandedMessages,
  hasNewMessages,
  chatContainerRef,
  endRef,
  input,
  setInput,
  onSuggestionClick,
  onToggleExpanded,
  onSendMessage,
  scrollToBottom,
}: ChatInterfaceProps) => {
  return (
    <>
      <div
        ref={chatContainerRef}
        className="flex-1 p-4 overflow-y-auto space-y-3 text-sm relative"
      >
        {/* Structured loading overlay - rendered separately from messages */}
        {Object.entries(structuredLoading).map(([messageIndex, isLoading]) =>
          isLoading ? (
            <div key={`loading-${messageIndex}`} className="mb-3">
              <EnhancedStructuredLoadingComponent />
            </div>
          ) : null
        )}

        {/* Typing indicator for regular streaming */}
        {isStreaming && !isStreamingStructured && !suggestionsLoading && (
          <div className="mb-3">
            <div className="max-w-[85%] self-start bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-50 rounded-md px-3 py-2">
              <TypingIndicator />
            </div>
          </div>
        )}

        {/* Chat messages */}
        {messages.map((m, i) => {
          // Special styling for welcome message (first AI message)
          const isWelcomeMessage = i === 0 && m.includes("favourite country");

          if (isWelcomeMessage) {
            const welcomeHasSuggestions =
              messageSuggestions[i] && messageSuggestions[i].length > 0;

            return (
              <div key={i}>
                <div className="w-full p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-md">
                  <div className="flex items-center mb-3">
                    <span className="text-xl mr-2">🌟</span>
                    <span className="font-semibold text-sm">
                      Welcome Message
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">
                    {stripPlaceMarkers(m)}
                  </p>
                </div>

                {/* Show welcome message suggestions or loading state */}
                {welcomeHasSuggestions ? (
                  <div className="mt-4 space-y-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Suggested questions:
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {messageSuggestions[i].map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => onSuggestionClick(suggestion)}
                          className="text-xs px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors border border-blue-200 dark:border-blue-700 text-left"
                          disabled={isStreaming}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : suggestionsLoading && i === 0 ? (
                  <SuggestionsLoadingComponent />
                ) : null}
              </div>
            );
          }

          // Regular message styling with structured response parsing
          const isAssistantMessage = i % 2 === 0;
          const parsedMessage = isAssistantMessage
            ? parseStructuredResponse(m)
            : { isStructured: false, originalText: m };

          // Check if this message is in structured loading state
          const isStructuredLoadingState =
            isAssistantMessage && structuredLoading[i];

          // Check if this message has associated suggestions
          const messageHasSuggestions =
            messageSuggestions[i] && messageSuggestions[i].length > 0;
          const shouldShowSuggestions =
            isAssistantMessage &&
            messageHasSuggestions &&
            !isStructuredLoadingState;

          return (
            <div key={i}>
              <div
                className={`max-w-[85%] break-words ${
                  isAssistantMessage
                    ? "self-start bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-50"
                    : "self-end bg-blue-600 text-white"
                } rounded-md px-3 py-2`}
              >
                {/* Show message content */}
                {parsedMessage.isStructured ? (
                  <StructuredMessageComponent parsedMessage={parsedMessage} />
                ) : (
                  <ExpandableText
                    text={parsedMessage.originalText}
                    messageIndex={i}
                    isExpanded={expandedMessages[i] || false}
                    onToggle={onToggleExpanded}
                  />
                )}
              </div>

              {/* Show suggestions for this specific message if they exist, or loading state */}
              {shouldShowSuggestions ? (
                <div className="mt-4 space-y-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {i === 0 ? "Suggested questions:" : "Continue exploring:"}
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {messageSuggestions[i].map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => onSuggestionClick(suggestion)}
                        className="text-xs px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors border border-blue-200 dark:border-blue-700 text-left"
                        disabled={isStreaming}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : suggestionsLoading &&
                isAssistantMessage &&
                i === messages.length - 1 &&
                !isStructuredLoadingState ? (
                <SuggestionsLoadingComponent />
              ) : null}
            </div>
          );
        })}

        {/* New message indicator */}
        {hasNewMessages && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
            <button
              onClick={() => scrollToBottom(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium transition-all duration-200 animate-bounce"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
              New message
            </button>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Message input */}
      <div className="p-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSendMessage(input);
            }
          }}
          className="flex-1 rounded-md border px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message"
          disabled={isStreaming}
        />
        <button
          onClick={() => onSendMessage(input)}
          className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          disabled={isStreaming}
        >
          Send
        </button>
      </div>
    </>
  );
};
