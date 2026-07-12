// TODO: Реалізувати відображення профілю у файлі Profile.tsx

import type React from "react";

export const Profile: React.FC = () => {
  // TODO: Код писати сюди
  return (
    <div className="max-w-wd mx-auto text-center py-12 bg-white border rounded-2xl shadow-sm py-6">
      <div className="text-5xl mb-4">👤</div>
      <h2 className="text-xl font-black text-gray-800">My Profile</h2>
      <p className="text-gray-500 text-sm mt-1">
        The personal configuration and editing panel is currently under
        construction.
      </p>
    </div>
  );
};
