import {
  SuggestionsStreamingIndicator,
  GlobalStreamingIndicator,
  StructuredStreamingIndicator,
} from "./LoadingComponents";

interface StreamingIndicatorsProps {
  suggestionsLoading: boolean;
  isStreaming: boolean;
  isStreamingStructured: boolean;
}

export const StreamingIndicators = ({
  suggestionsLoading,
  isStreaming,
  isStreamingStructured,
}: StreamingIndicatorsProps) => {
  return (
    <>
      {suggestionsLoading && <SuggestionsStreamingIndicator />}
      {isStreaming && !isStreamingStructured && !suggestionsLoading && (
        <GlobalStreamingIndicator />
      )}
      {isStreamingStructured && <StructuredStreamingIndicator />}
    </>
  );
};
