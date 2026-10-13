import { useState } from "react";
import { AVAILABLE_INTERESTS } from "../../../entities/user/model/types.ts";
import type { EditProfileModalProps } from "../model/types.ts";

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  currentProfile,
  onSave,
  onClose,
}) => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    Array.isArray(currentProfile.interests) ? currentProfile.interests : [],
  );
  const [likesLongWalks, setLikesLongWalks] = useState(
    currentProfile.likesLongWalks || false,
  );
  const [lookingFor, setLookingFor] = useState(currentProfile.lookingFor || "");

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests((prev) => prev.filter((item) => item !== interest));
    } else {
      if (selectedInterests.length < 8) {
        setSelectedInterests((prev) => [...prev, interest]);
      } else {
        window.alert("You can select up to 8 interests!");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...currentProfile,
      interests: selectedInterests,
      likesLongWalks,
      lookingFor,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="mb-4 text-xl font-bold text-gray-900">Edit Profile</h2>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Looking For
          </label>
          <select
            value={lookingFor}
            onChange={(e) => setLookingFor(e.target.value)}
            className="w-full rounded-lg border border-gray-200 p-2 text-sm outline-none"
          >
            <option value="">Not specified</option>
            <option value="Friends">Friends</option>
            <option value="Relationships">Relationships</option>
          </select>
        </div>

        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            id="walks"
            checked={likesLongWalks}
            onChange={(e) => setLikesLongWalks(e.target.checked)}
            className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label
            htmlFor="walks"
            className="text-sm font-semibold text-gray-700"
          >
            I love long walks 🚶‍♂️🚶‍♀️
          </label>
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Interests ({selectedInterests.length}/8)
          </label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_INTERESTS.map((interest) => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isSelected
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

