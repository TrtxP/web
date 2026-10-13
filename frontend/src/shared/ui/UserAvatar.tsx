import React from "react";
import { getAvatarUrl } from "../utils/avatar.ts";

export interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  sizeClassName?: string;
  isOnline?: boolean;
  showStatusDot?: boolean;
  fallbackIcon?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  className = "relative",
  sizeClassName = "w-28 h-28",
  isOnline,
  showStatusDot = false,
  fallbackIcon,
}) => {
  const avatarUrl = getAvatarUrl(src);
  const initial = name ? name.trim().charAt(0).toUpperCase() : "";

  return (
    <div className={`${className} ${sizeClassName}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name || "User Avatar"}
          className="w-full h-full object-cover rounded-full border-2 border-white shadow-sm"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-4xl font-bold shadow-inner">
          {initial || fallbackIcon || "👤"}
        </div>
      )}

      {showStatusDot && typeof isOnline === "boolean" && (
        <span
          className={`status ${isOnline ? "status-success" : "status-warning"}`}
          title={isOnline ? "Online" : "Offline"}
        />
      )}
    </div>
  );
};

