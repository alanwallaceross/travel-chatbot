export const SuggestionsLoadingComponent = () => (
  <div className="mt-4 space-y-3">
    <div className="flex items-center gap-2">
      <div className="flex space-x-1">
        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0ms]"></div>
        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:100ms]"></div>
        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:200ms]"></div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
        Generating suggestions...
      </p>
    </div>
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="text-xs px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:${
                i * 100
              }ms]`}
            ></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const GlobalStreamingIndicator = () => (
  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500">
    <div className="flex space-x-1">
      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0ms]"></div>
      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:100ms]"></div>
      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:200ms]"></div>
    </div>
    <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
      AI is responding...
    </span>
  </div>
);

export const StructuredStreamingIndicator = () => (
  <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500">
    <div className="flex space-x-1">
      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0ms]"></div>
      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:100ms]"></div>
      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:200ms]"></div>
    </div>
    <span className="text-xs text-purple-700 dark:text-purple-300 font-medium">
      Loading detailed information...
    </span>
  </div>
);

export const SuggestionsStreamingIndicator = () => (
  <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500">
    <div className="flex space-x-1">
      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:0ms]"></div>
      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:100ms]"></div>
      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:200ms]"></div>
    </div>
    <span className="text-xs text-green-700 dark:text-green-300 font-medium">
      Generating suggestions...
    </span>
  </div>
);

export const TypingIndicator = () => (
  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
    <div className="flex space-x-1">
      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]"></div>
      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:100ms]"></div>
      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:200ms]"></div>
    </div>
    <span className="text-xs">AI is typing...</span>
  </div>
);

export const EnhancedStructuredLoadingComponent = () => (
  <div className="space-y-4 border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0ms]"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:100ms]"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:200ms]"></div>
        </div>
        <span className="text-sm font-medium">
          Loading detailed recommendations...
        </span>
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
        <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            className="opacity-25"
            fill="none"
          />
          <path
            fill="currentColor"
            className="opacity-75"
            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span>Processing...</span>
      </div>
    </div>
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700 animate-pulse shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-600 dark:to-purple-600 rounded-full animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gradient-to-r from-blue-200 to-transparent dark:from-blue-600 dark:to-transparent rounded w-3/4 animate-pulse"></div>
              <div className="h-3 bg-gradient-to-r from-gray-200 to-transparent dark:from-gray-600 dark:to-transparent rounded w-full animate-pulse"></div>
              <div className="h-3 bg-gradient-to-r from-gray-200 to-transparent dark:from-gray-600 dark:to-transparent rounded w-2/3 animate-pulse"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="text-xs text-center text-gray-500 dark:text-gray-400 italic">
      This may take a few moments while we gather the best information for you
    </div>
  </div>
);
