import React from "react";

interface ProfileInterestsSectionProps {
  isEditing: boolean;
  interests?: string[];
  editedInterests?: string[];
  onOpenEditModal: () => void;
}

export const ProfileInterestsSection: React.FC<ProfileInterestsSectionProps> = ({
  isEditing,
  interests,
  editedInterests,
  onOpenEditModal,
}) => {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
        <span>🔥</span> Interests & Hobbies
      </h3>
      {isEditing ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-gray-400">
              Choose the hobbies that describe you:
            </p>
            <button
              type="button"
              onClick={onOpenEditModal}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Edit details
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(editedInterests || []).length > 0 ? (
              (editedInterests || []).map((interest, index) => (
                <span
                  key={index}
                  className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-100/50"
                >
                  {interest}
                </span>
              ))
            ) : (
              <p className="text-sm text-gray-400">
                No interests selected yet.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {interests && interests.length > 0 ? (
            interests.map((interest, index) => (
              <span
                key={index}
                className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-100/50"
              >
                {interest}
              </span>
            ))
          ) : (
            <p className="text-gray-400 text-sm">
              Interests not specified.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

