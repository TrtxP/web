import React from "react";

interface ProfileAboutSectionProps {
  isEditing: boolean;
  aboutMe?: string;
  editedAboutMe?: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const ProfileAboutSection: React.FC<ProfileAboutSectionProps> = ({
  isEditing,
  aboutMe,
  editedAboutMe,
  onChange,
}) => {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
        <span>📝</span> About Me
      </h3>
      {isEditing ? (
        <textarea
          name="aboutMe"
          value={editedAboutMe || ""}
          onChange={onChange}
          className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition-all"
          rows={4}
          placeholder="Write a few words about yourself..."
        />
      ) : (
        <p className="text-gray-600 leading-relaxed text-sm italic">
          {aboutMe
            ? `"${aboutMe}"`
            : "User still doesn't talk about yourself."}
        </p>
      )}
    </div>
  );
};

