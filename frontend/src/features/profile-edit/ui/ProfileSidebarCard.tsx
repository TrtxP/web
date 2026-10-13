import React from "react";
import type { PrivateAggregatedProfile } from "../../../entities/user/model/types.ts";
import type { UserStatus } from "../../../shared/utils/date.ts";
import { getAvatarUrl } from "../../../shared/utils/avatar.ts";

export interface ProfileSidebarCardProps {
  profile: PrivateAggregatedProfile;
  isEditing: boolean;
  isSaving: boolean;
  isUploadingPhoto: boolean;
  status: UserStatus | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onEditClick: () => void;
  onCancel: () => void;
  onTriggerFileInput: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeletePhoto: () => void;
}

export const ProfileSidebarCard: React.FC<ProfileSidebarCardProps> = ({
  profile,
  isEditing,
  isSaving,
  isUploadingPhoto,
  status,
  fileInputRef,
  onEditClick,
  onCancel,
  onTriggerFileInput,
  onFileChange,
  onDeletePhoto,
}) => {
  return (
    <div className="md:col-span-1 bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col items-center text-center h-fit">
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        accept="image/*"
        className="hidden"
      />

      <div className="relative w-32 h-32 mb-4 group">
        <div
          onClick={isEditing && !isUploadingPhoto ? onTriggerFileInput : undefined}
          className={`w-full h-full rounded-full overflow-hidden border-4 border-gray-50 shadow-md ${
            isEditing ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
          }`}
        >
          {profile.profilePictureUrl ? (
            <img
              src={getAvatarUrl(profile.profilePictureUrl)}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-blue-50 text-blue-600 flex items-center justify-center text-5xl font-bold shadow-inner">
              {profile.name ? profile.name.charAt(0).toUpperCase() : "👤"}
            </div>
          )}

          {isEditing && (
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              {isUploadingPhoto ? "Loading..." : "Change photo"}
            </div>
          )}
        </div>

        <span
          className={`status ${status?.colorClass}`}
          title={status?.text}
        />
      </div>

      {isEditing && profile.profilePictureUrl && (
        <button
          type="button"
          onClick={onDeletePhoto}
          disabled={isUploadingPhoto}
          className="text-xs text-red-500 hover:text-red-700 font-semibold mb-4 transition-colors disabled:opacity-50"
        >
          Delete current photo
        </button>
      )}

      <h2 className="text-2xl font-black text-gray-800 mb-1">
        {profile.name}
      </h2>

      {profile.email && (
        <div className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1 mb-3 flex items-center gap-1.5">
          <span>📧</span>
          <span className="font-mono select-all">{profile.email}</span>
        </div>
      )}

      <div className="flex items-center justify-center flex-wrap gap-1 text-gray-500 text-sm mb-4">
        <span>📍 {profile.city || "City not specified"}</span>
        {profile.age && <span>• {profile.age} years</span>}
        {profile.gender && (
          <span>
            •{" "}
            {profile.gender === "male"
              ? "male"
              : profile.gender === "female"
                ? "female"
                : profile.gender}
          </span>
        )}
      </div>

      <span
        className={`${
          profile.isOnline
            ? "inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 inset-ring inset-ring-green-600/20"
            : "inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 inset-ring inset-ring-yellow-600/20"
        }`}
      >
        {profile.isOnline ? "Active Now" : "Offline"}
      </span>

      <hr className="w-full my-5 border-gray-100" />

      {!isEditing ? (
        <button
          type="button"
          onClick={onEditClick}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded text-sm transition-colors shadow-sm"
        >
          Edit Profile
        </button>
      ) : (
        <div className="w-full space-y-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

