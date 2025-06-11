import { breakIntoChunks, stripPlaceMarkers } from "../utils/messageParser";

interface ExpandableTextProps {
  text: string;
  messageIndex: number;
  isExpanded: boolean;
  onToggle: (messageIndex: number, expanded: boolean) => void;
}

export const ExpandableText = ({
  text,
  messageIndex,
  isExpanded,
  onToggle,
}: ExpandableTextProps) => {
  const strippedText = stripPlaceMarkers(text);
  const chunks = breakIntoChunks(strippedText, 250);

  if (chunks.length <= 1) {
    return <span>{strippedText}</span>;
  }

  const previewText = chunks[0];

  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed">{previewText}</p>

      {!isExpanded && (
        <button
          onClick={() => onToggle(messageIndex, true)}
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
        >
          <span>Show more</span>
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      )}

      {isExpanded && (
        <>
          <div className="space-y-3">
            {chunks.slice(1).map((chunk, idx) => (
              <p
                key={idx}
                className="text-sm leading-relaxed text-gray-700 dark:text-white"
              >
                {chunk}
              </p>
            ))}
          </div>
          <button
            onClick={() => onToggle(messageIndex, false)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
          >
            <span>Show less</span>
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
          </button>
        </>
      )}
    </div>
  );
};
