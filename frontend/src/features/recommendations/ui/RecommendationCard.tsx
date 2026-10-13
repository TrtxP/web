import React from "react";
import type { AggregatedProfile } from "../../../entities/user/model/types.ts";
import { getUserStatus } from "../../../shared/utils/date.ts";
import { getAvatarUrl } from "../../../shared/utils/avatar.ts";

interface RecommendationCardProps {
  profile: AggregatedProfile;
  onSelect: () => void;
  onConnect: (id: number) => void;
  onDismiss: (id: number) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  profile,
  onSelect,
  onConnect,
  onDismiss,
}) => {
  const status = getUserStatus(!!profile.isOnline, profile.lastSeenAt);

  return (
    <div
      onClick={onSelect}
      className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 flex flex-col items-center text-center transition-transform hover:-translate-y-1 cursor-pointer"
    >
      <div className="relative w-28 h-28 mb-4">
        {profile.profilePictureUrl ? (
          <img
            src={getAvatarUrl(profile.profilePictureUrl)}
            alt={profile.name}
            className="w-full h-full object-cover rounded-full border-2 border-white shadow-sm"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-4xl">
            👤
          </div>
        )}

        <span
          className={`status ${status.isOnline ? "status-success" : "status-warning"}`}
          title={status.isOnline ? "Online" : "Offline"}
        ></span>
      </div>

      <div className="mb-4 w-full">
        <h3 className="text-lg font-bold text-gray-900">
          {profile.name}
        </h3>
        <p className="text-sm text-gray-500 italic mt-1 line-clamp-2">
          "{profile.aboutMe || "No customized description indexed by this user asset."}"
        </p>
      </div>

      <div className="w-full mb-5 text-left">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Interests
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {profile.interests &&
            profile.interests.map((interest, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-md"
              >
                {interest}
              </span>
            ))}
        </div>
      </div>

      <div className="flex gap-3 w-full mt-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(profile.id);
          }}
          className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 rounded text-sm transition-colors"
        >
          Dismiss
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onConnect(profile.id);
          }}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded text-sm transition-colors"
        >
          Connect
        </button>
      </div>
    </div>
  );
};

