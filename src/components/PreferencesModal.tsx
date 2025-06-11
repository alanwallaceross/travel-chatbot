import { UserPreferences } from "../hooks/useChat";
import { continents } from "../data/travelData";

interface PreferencesModalProps {
  show: boolean;
  preferences: UserPreferences;
  setPreferences: (preferences: UserPreferences) => void;
  onClose: () => void;
  onUpdate: (preferences: UserPreferences) => void;
}

export const PreferencesModal = ({
  show,
  preferences,
  setPreferences,
  onClose,
  onUpdate,
}: PreferencesModalProps) => {
  if (!show) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      preferences.country &&
      preferences.continent &&
      preferences.destination
    ) {
      onUpdate(preferences);
    }
  };

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Update Preferences
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Favorite Country
            </label>
            <input
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
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Favorite Continent
            </label>
            <select
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
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Favorite Destination
            </label>
            <input
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

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-xs"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
