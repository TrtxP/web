import React from "react";
import type { PrivateAggregatedProfile } from "../../../entities/user/model/types.ts";
import type { CitySuggestion } from "../model/types.ts";

interface ProfilePreferencesSectionProps {
  isEditing: boolean;
  profile: PrivateAggregatedProfile;
  editedData: Partial<PrivateAggregatedProfile>;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  onOpenEditModal: () => void;
  onRecommendByCityOnlyChange: (checked: boolean) => void;
  citySearch: string;
  onCitySearchChange: (value: string) => void;
  suggestions: CitySuggestion[];
  isSearching: boolean;
  onSelectCity: (suggestion: CitySuggestion) => void;
}

export const ProfilePreferencesSection: React.FC<
  ProfilePreferencesSectionProps
> = ({
  isEditing,
  profile,
  editedData,
  onInputChange,
  onOpenEditModal,
  onRecommendByCityOnlyChange,
  citySearch,
  onCitySearchChange,
  suggestions,
  isSearching,
  onSelectCity,
}) => {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="p-3 bg-gray-50 rounded-xl">
        <span className="text-xs text-gray-400 uppercase font-bold block mb-1">
          Looking For
        </span>
        {isEditing ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={onOpenEditModal}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 block"
            >
              Edit
            </button>
            <div className="text-sm font-semibold text-gray-700">
              {editedData.lookingFor || "Not specified"}
            </div>
          </div>
        ) : (
          <span className="text-sm font-semibold text-gray-700">
            {profile.lookingFor || "Not specified"}
          </span>
        )}
      </div>

      <div className="p-3 bg-gray-50 rounded-xl">
        <span className="text-xs text-gray-400 uppercase font-bold block mb-1">
          Favorite Food
        </span>
        {isEditing ? (
          <input
            type="text"
            name="favoriteFood"
            value={editedData.favoriteFood || ""}
            onChange={onInputChange}
            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none"
            placeholder="e.g. Pizza, Sushi"
          />
        ) : (
          <span className="text-sm font-semibold text-gray-700">
            {profile.favoriteFood || "Not specified"}
          </span>
        )}
      </div>

      <div className="p-3 bg-gray-50 rounded-xl">
        <span className="text-xs text-gray-400 uppercase font-bold block mb-1">
          Favorite Music
        </span>
        {isEditing ? (
          <input
            type="text"
            name="favoriteMusic"
            value={editedData.favoriteMusic || ""}
            onChange={onInputChange}
            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none"
            placeholder="e.g. Rock, Jazz, Pop"
          />
        ) : (
          <span className="text-sm font-semibold text-gray-700">
            {profile.favoriteMusic || "Not specified"}
          </span>
        )}
      </div>

      <div className="p-3 bg-gray-50 rounded-xl flex flex-col justify-between">
        <span className="text-xs text-gray-400 uppercase font-bold block mb-1">
          Long Walks
        </span>
        {isEditing ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={onOpenEditModal}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 block"
            >
              Edit
            </button>
            <span className="text-sm font-semibold text-gray-700 block">
              {editedData.likesLongWalks
                ? "❤️ Loves long walks"
                : "🤷‍♂️ Doesn't care much"}
            </span>
          </div>
        ) : (
          <span className="text-sm font-semibold text-gray-700">
            {profile.likesLongWalks
              ? "❤️ Loves long walks"
              : "🤷‍♂️ Doesn't care much"}
          </span>
        )}
      </div>

      {/* Налаштування рекомендацій за містом */}
      <div className="p-3 bg-gray-50 rounded-xl flex flex-col justify-between">
        <span className="text-xs text-gray-400 uppercase font-bold block mb-1">
          Recommendations
        </span>
        {isEditing ? (
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={!!editedData.recommendByCityOnly}
              onChange={(e) => onRecommendByCityOnlyChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Show only my city
          </label>
        ) : (
          <span className="text-sm font-semibold text-gray-700">
            {profile.recommendByCityOnly
              ? "🏙️ Only my city"
              : "🌍 My city + nearby (by distance)"}
          </span>
        )}
      </div>

      {isEditing && (
        <>
          <div className="p-3 bg-gray-50 rounded-xl relative">
            <span className="text-xs text-gray-400 uppercase font-bold block mb-1">
              City
            </span>
            <div className="relative">
              <input
                type="text"
                value={citySearch}
                onChange={(e) => onCitySearchChange(e.target.value)}
                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
                placeholder="Type city name..."
              />

              {suggestions.length > 0 &&
                citySearch.trim() !== "" &&
                citySearch !== (profile.city || editedData.city) && (
                  <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg max-h-48 overflow-y-auto shadow-lg">
                    {suggestions.map((s, index) => (
                      <li
                        key={index}
                        onClick={() => onSelectCity(s)}
                        className="p-2 text-xs hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-none"
                      >
                        {s.display_name}
                      </li>
                    ))}
                  </ul>
                )}
              {isSearching && (
                <span className="absolute right-3 top-3 text-xs text-gray-400">
                  Searching...
                </span>
              )}
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl">
            <span className="text-xs text-gray-400 uppercase font-bold block mb-1">
              Age
            </span>
            <input
              type="number"
              name="age"
              value={editedData.age || ""}
              onChange={onInputChange}
              className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none"
              placeholder="e.g. 21"
              min="18"
              max="100"
            />
          </div>

          <div className="p-3 bg-gray-50 rounded-xl">
            <span className="text-xs text-gray-400 uppercase font-bold block mb-1">
              Gender
            </span>
            <select
              name="gender"
              value={editedData.gender || ""}
              onChange={onInputChange}
              className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none"
            >
              <option value="">Select gender</option>
              <option value="male">male</option>
              <option value="female">female</option>
            </select>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-400 uppercase font-bold block mb-1">
                Preferred Distance
              </span>
              <span className="text-sm font-bold text-blue-600">
                {editedData.preferredDistance || 50} km
              </span>
            </div>
            <input
              type="range"
              name="preferredDistance"
              min="10"
              max="900"
              step="5"
              value={editedData.preferredDistance || 50}
              onChange={onInputChange}
              disabled={!!editedData.recommendByCityOnly}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-600 ${
                editedData.recommendByCityOnly
                  ? "bg-gray-200 cursor-not-allowed opacity-50"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
              placeholder="e.g. 50"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>10 km</span>
              <span>900 km</span>
            </div>
            {editedData.recommendByCityOnly && (
              <p className="text-[10px] text-gray-400 mt-1">
                Ignored while "Show only my city" is enabled
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

