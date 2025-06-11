import { UserPreferences } from "../hooks/useChat";
import { continents } from "../data/travelData";

interface OnboardingFormProps {
  preferences: UserPreferences;
  setPreferences: (preferences: UserPreferences) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const OnboardingForm = ({
  preferences,
  setPreferences,
  onSubmit,
}: OnboardingFormProps) => {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Welcome to Travel Assistant! ✈️
        </h1>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          Tell us about your travel preferences to get personalized advice
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label
            htmlFor="country"
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Favorite Country
          </label>
          <input
            id="country"
            type="text"
            value={preferences.country}
            onChange={(e) =>
              setPreferences({ ...preferences, country: e.target.value })
            }
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
            placeholder="e.g., Japan"
          />
        </div>

        <div>
          <label
            htmlFor="continent"
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Favorite Continent
          </label>
          <select
            id="continent"
            value={preferences.continent}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                continent: e.target.value,
              })
            }
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
          >
            <option value="">Select a continent</option>
            {continents.map((continent) => (
              <option key={continent} value={continent}>
                {continent}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="destination"
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Favorite Destination
          </label>
          <input
            id="destination"
            type="text"
            value={preferences.destination}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                destination: e.target.value,
              })
            }
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
            placeholder="e.g., Tokyo"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-xs"
        >
          Start Chat
        </button>
      </form>
    </div>
  );
};
