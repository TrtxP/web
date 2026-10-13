import React from "react";
import type { ConnectionAggregatedProfile } from "../model/types.ts";
import { getUserStatus } from "../../../shared/utils/date.ts";
import { getAvatarUrl } from "../../../shared/utils/avatar.ts";

interface ConnectedUserCardProps {
  user: ConnectionAggregatedProfile;
  onSelect: () => void;
  onDisconnect: (id: number, e: React.MouseEvent) => void;
  onStartChat: (id: number, e: React.MouseEvent) => void;
}

export const ConnectedUserCard: React.FC<ConnectedUserCardProps> = ({
  user,
  onSelect,
  onDisconnect,
  onStartChat,
}) => {
  const status = getUserStatus(!!user.isOnline, user.lastSeenAt);

  return (
    <div
      onClick={onSelect}
      className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 flex flex-col items-center text-center transition-transform hover:-translate-y-1 cursor-pointer"
    >
      <div className="relative w-28 h-28 mb-4">
        {user.profilePictureUrl ? (
          <img
            src={getAvatarUrl(user.profilePictureUrl)}
            alt={user.name}
            className="w-full h-full object-cover rounded-full border-2 border-white shadow-sm"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-4xl font-bold shadow-inner">
            {user.name?.charAt(0).toUpperCase()}
          </div>
        )}
        <span
          className={`status ${status.isOnline ? "status-success" : "status-warning"}`}
          title={status.isOnline ? "Online" : "Offline"}
        />
      </div>

      <div className="mb-4 w-full">
        <h3 className="text-2xl font-bold text-gray-900">
          {user.name}
          {user.age ? `, ${user.age}` : ""}
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          📍 {user.city || "Not specified"}
        </p>
        <p className="text-sm text-gray-500 italic mt-2 line-clamp-2">
          {user.aboutMe ? `"${user.aboutMe}"` : "No bio shared."}
        </p>
      </div>

      <div className="flex gap-3 w-full mt-auto">
        <button
          onClick={(e) => onDisconnect(user.id, e)}
          className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 rounded text-sm transition-colors"
        >
          Disconnect
        </button>
        <button
          onClick={(e) => onStartChat(user.id, e)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded text-sm transition-colors"
        >
          Start Chat
        </button>
      </div>
    </div>
  );
};

