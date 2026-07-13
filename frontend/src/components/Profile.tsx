import type React from "react";
import { matchService, type AggregatedProfile } from "../services/matchService";
import { useEffect, useState } from "react";

export const Profile: React.FC = () => {
  const [profile, setProfile] = useState<AggregatedProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyProfile = async () => {
      try {
        setLoading(true);
        const data = await matchService.getMyFullProfile();
        setProfile(data);
      } catch (err) {
        console.error(`Error loading profile: ${err}`);
        setError("Failed load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchMyProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto text-center py-12 bg-red-50 border border-red-200 rounded-2xl p-6">
        <div className="text-4xl mb-2">⚠️</div>
        <h2 className="text-lg font-bold text-red-800">Error</h2>
        <p className="text-red-600 text-sm mt-1">
          {error || "Profile not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 ms:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col items-center text-center h-fit">
          <div className="relative w-32 h-32 mb-4">
            {profile.profilePictureUrl ? (
              <img
                src={profile.profilePictureUrl}
                alt={profile.name}
                className="w-full h-full object-cover rounded-full border-4 border-gray-50 shadow-md"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-5xl font-bold shadow-inner">
                {profile.name ? profile.name.charAt(0).toUpperCase() : "👤"}
              </div>
            )}
            <span
              className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-white ${
                profile.isOnline ? "bg-green-500" : "bg-gray-400"
              }`}
              title={profile.isOnline ? "Online" : "Offline"}
            ></span>
          </div>

          <h2 className="text-2xl font-black text-gray-800 mb-1">
            {profile.name}
          </h2>

          <div className="flex items-center gap-1 text-gray-500 text-sm mb-4">
            <span>📍 {profile.city || "City not specified"}</span>
            {profile.age && <span>• {profile.age} years</span>}
            {profile.gender && (
              <span>• {profile.gender === 'male' ? '👨 Man' : profile.gender === 'woman' ? '👩 Woman' : profile.gender}</span>
            )}
          </div>

          <span
            className={`text-xs font-bold px-3 py-1.5 rounded-full ${
              profile.isOnline
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {profile.isOnline ? "● Active Now" : "○ Offline"}
          </span>

          <hr className="w-full my-5 border-gray-100" />

          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-sm">
            Edit Profile
          </button>

          <div className="md:col-span-2 space-y-6 p-10">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>📝</span> About Me
              </h3>
              <p className="text-gray-600 leading-relaxed text-sm italic">
                {profile.aboutMe
                  ? `"${profile.aboutMe}"`
                  : "User still doesn't talk about yourself."}
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>🔥</span> Interests & Hobbies
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests && profile.interests.length > 0 ? (
                  profile.interests.map((interest, index) => (
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
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-xs text-gray-400 uppercase font-bold block mb-1">Looking For</span>
                <span className="text-sm font-semibold text-gray-700">{profile.lookingFor || "Not specified"}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-xs text-gray-400 uppercase font-bold block mb-1">Favorite Food</span>
                <span className="text-sm font-semibold text-gray-700">{profile.favoriteFood || "Not specified"}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-xs text-gray-400 uppercase font-bold block mb-1">Favorite Music</span>
                <span className="text-sm font-semibold text-gray-700">{profile.favoriteMusic || "Not specified"}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-xs text-gray-400 uppercase font-bold block mb-1">Long Walks</span>
                <span className="text-sm font-semibold text-gray-700">
                  {profile.likesLongWalks ? "❤️ Loves long walks" : "🤷‍♂️ Doesn't care much"}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
