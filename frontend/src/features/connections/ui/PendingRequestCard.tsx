import React from "react";
import type { ConnectionAggregatedProfile } from "../model/types.ts";
import { getUserStatus } from "../../../shared/utils/date.ts";
import { getAvatarUrl } from "../../../shared/utils/avatar.ts";

interface PendingRequestCardProps {
  user: ConnectionAggregatedProfile;
  onSelect: () => void;
  onRespond: (
    connectionId: number | undefined,
    accept: boolean,
    e: React.MouseEvent,
  ) => void;
}

export const PendingRequestCard: React.FC<PendingRequestCardProps> = ({
  user,
  onSelect,
  onRespond,
}) => {
  const status = getUserStatus(!!user.isOnline, user.lastSeenAt);

  return (
    <div
      onClick={onSelect}
      className="bg-white rounded-2xl shadow-md border border-amber-100 p-5 flex flex-col items-center text-center transition-transform hover:-translate-y-1 cursor-pointer"
    >
      <div className="relative w-28 h-28 mb-4">
        {user.profilePictureUrl ? (
          <img
            src={getAvatarUrl(user.profilePictureUrl)}
            alt={user.name}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-4xl font-bold">
            {user.name?.charAt(0).toUpperCase()}
          </div>
        )}
        <span
          className={`status ${status.isOnline ? "status-success" : "status-warning"}`}
          title={status.isOnline ? "Online" : "Offline"}
        ></span>
      </div>

      <div className="mb-4 w-full">
        <h3 className="text-2xl font-bold text-gray-900">
          {user.name}
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          📍 {user.city || "Not specified"}
        </p>
      </div>

      <div className="flex gap-3 w-full mt-auto">
        <button
          onClick={(e) => onRespond(user.connectionId, false, e)}
          className="flex-1 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-500 border border-transparent hover:border-red-200 font-semibold py-2 rounded text-sm transition-colors"
        >
          Reject
        </button>
        <button
          onClick={(e) => onRespond(user.connectionId, true, e)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded text-sm transition-colors"
        >
          Accept
        </button>
      </div>
    </div>
  );
};

