import {
  ParsedMessage,
  stripPlaceMarkers,
  generateGoogleMapsLink,
} from "../utils/messageParser";

interface StructuredMessageComponentProps {
  parsedMessage: ParsedMessage;
}

export const StructuredMessageComponent = ({
  parsedMessage,
}: StructuredMessageComponentProps) => (
  <div className="space-y-4">
    {parsedMessage.intro && (
      <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 mb-4">
        {stripPlaceMarkers(parsedMessage.intro)}
      </p>
    )}
    <div className="space-y-3">
      {parsedMessage.components?.map((component, idx) => {
        const mapsLink = generateGoogleMapsLink(component.title);

        return (
          <div
            key={idx}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 flex flex-col items-center gap-1">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {idx + 1}
                  </span>
                </div>
                {mapsLink && (
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-6 h-6 bg-gray-600 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 text-white hover:scale-110 transform"
                    title={`View "${component.title}" on Google Maps`}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-white"
                    >
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                  </a>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1 leading-tight">
                  {stripPlaceMarkers(component.title)}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {stripPlaceMarkers(component.description)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);
