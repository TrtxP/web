import React, { useEffect, useState } from "react";
import { matchService, type AggregatedProfile } from "../services/matchService";
import type { UserProfileDTO, UserBioDTO } from "../types";

export const Profile: React.FC = () => {
  const [profile, setProfile] = useState<AggregatedProfile | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState<string>("");
  const [aboutMe, setAboutMe] = useState<string>("");
  const [interests, setInterests] = useState<string>("");
  const [favoriteFood, setFavoriteFood] = useState<string>("");
  const [favoriteMusic, setFavoriteMusic] = useState<string>("");
  const [likesLongWalks, setLikesLongWalks] = useState<boolean>(false);
  const [lookingFor, setLookingFor] = useState<string>("");

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const data = await matchService.getMyFullProfile();
      setProfile(data);

      // Populate form state fields safely
      setName(data.name || "");
      setAboutMe(data.aboutMe || "");
      setInterests(data.interests ? data.interests.join(", ") : "");
      setFavoriteFood(data.favoriteFood || "");
      setFavoriteMusic(data.favoriteMusic || "");
      setLikesLongWalks(!!data.likesLongWalks);
      setLookingFor(data.lookingFor || "");
      setError(null);
    } catch (err: any) {
      setError("Failed to load profile details from the server.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const processedInterests = interests
        .split(",")
        .map((i) => i.trim())
        .filter((i) => i.length > 0);

      const profilePayload: Partial<UserProfileDTO> = {
        aboutMe: aboutMe,
      };

      const bioPayload: Partial<UserBioDTO> = {
        interests: processedInterests,
        favoriteFood,
        favoriteMusic,
        likesLongWalks,
        lookingFor,
      };

      await matchService.updateProfile(name, profilePayload, bioPayload);
      
      await fetchUserProfile();
      setIsEditing(false);
      setError(null);
    } catch (err: any) {
      setError("Failed to save profile configurations.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="max-w-xl mx-auto text-center py-12 text-gray-500">
        Loading your profile configurations...
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto my-8 p-6 bg-white border border-gray-200 rounded-2xl shadow-sm text-left">
      <h1 className="text-2xl font-black text-gray-900 text-center mb-6">My Profile</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      {profile && !isEditing ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4 border-b pb-6">
            {profile.profilePictureUrl ? (
              <img
                src={profile.profilePictureUrl}
                alt={profile.name}
                className="w-16 h-16 rounded-full object-cover border"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-3xl">
                👤
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {profile.name}
                <span className={`text-xs px-2 py-0.5 rounded-full font-normal ${profile.isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {profile.isOnline ? "Online" : "Offline"}
                </span>
              </h2>
              <p className="text-gray-500 text-sm mt-1">Looking for: {profile.lookingFor || "Not specified"}</p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">About Me</h3>
            <p className="text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 min-h-[4rem]">
              {profile.aboutMe || "Add an introductory biography to introduce yourself to your potential matches!"}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests && profile.interests.length > 0 ? (
                profile.interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium border border-purple-100"
                  >
                    {interest}
                  </span>
                ))
              ) : (
                <p className="text-gray-400 text-sm italic">No interests configured yet.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Favorite Food</h3>
              <p className="text-gray-800 font-medium">{profile.favoriteFood || "N/A"}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Favorite Music</h3>
              <p className="text-gray-800 font-medium">{profile.favoriteMusic || "N/A"}</p>
            </div>
            <div className="col-span-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Likes Long Walks</h3>
              <p className="text-gray-800 font-medium">{profile.likesLongWalks ? "Yes, absolutely!" : "No, not really."}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-xl transition duration-200"
          >
            Edit Profile Configuration
          </button>
        </div>
      ) : (
        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-2.5 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Looking For</label>
            <input
              type="text"
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
              placeholder="e.g., Friends, Dating, Long-term relationship"
              className="w-full p-2.5 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">About Me</label>
            <textarea
              value={aboutMe}
              onChange={(e) => setAboutMe(e.target.value)}
              rows={3}
              placeholder="Tell others a bit about yourself..."
              className="w-full p-2.5 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Interests (separated by commas)</label>
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="Coding, Music, Travel, Reading"
              className="w-full p-2.5 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Favorite Food</label>
              <input
                type="text"
                value={favoriteFood}
                onChange={(e) => setFavoriteFood(e.target.value)}
                className="w-full p-2.5 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Favorite Music</label>
              <input
                type="text"
                value={favoriteMusic}
                onChange={(e) => setFavoriteMusic(e.target.value)}
                className="w-full p-2.5 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="likesLongWalks"
              checked={likesLongWalks}
              onChange={(e) => setLikesLongWalks(e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="likesLongWalks" className="text-sm font-medium text-gray-700 select-none">
              I enjoy going for long walks
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-xl transition duration-200"
            >
              Save Configuration
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-2.5 px-4 rounded-xl transition duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};