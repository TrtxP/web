import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { matchService } from "../services/matchService";
import type { CitySuggestion, PrivateAggregatedProfile, ProfileProps } from "../types";

const AVAILABLE_INTERESTS = [
  "Music",
  "Cinema",
  "Books",
  "Sports",
  "Coding",
  "Gaming",
  "Cooking",
  "Travel",
  "Art",
  "Photography",
];

export const Profile: React.FC<ProfileProps> = ({ onProfileUpdate }) => {
  const location = useLocation();
  const showWarning = location.state?.forceFill === true;
  
  const [profile, setProfile] = useState<PrivateAggregatedProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedData, setEditedData] = useState<
    Partial<PrivateAggregatedProfile>
  >({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);

  const [citySearch, setCitySearch] = useState(editedData.city || "");
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchMyProfile = async () => {
      try {
        setLoading(true);
        const data = await matchService.getMyFullProfile();
        setProfile(data);
        setEditedData(data);
      } catch (err) {
        console.error(`Error loading profile: ${err}`);
        setError("Failed load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchMyProfile();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (citySearch.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        // Запит до безкоштовного Nominatim API (OpenStreetMap)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(citySearch)}&addressdetails=1&limit=5`,
        );
        const data = await response.json();

        // Фільтруємо лише населені пункти (міста, села тощо)
        const cities = data.map(
          (item: { display_name: string; lat: string; lon: string }) => ({
            display_name: item.display_name,
            lat: item.lat,
            lon: item.lon,
          }),
        );

        setSuggestions(cities);
      } catch (error) {
        console.error("Error fetching cities:", error);
      } finally {
        setIsSearching(false);
      }
    }, 600); // шукаємо через 600мс після того, як користувач припинив писати

    return () => clearTimeout(delayDebounceFn);
  }, [citySearch]);

  const handleEditClick = () => {
    if (profile) {
      setEditedData({ ...profile });
      setIsEditing(true);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setEditedData((prev) => ({
      ...prev,
      [name]: name === "preferredDistance" ? Number(value) : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setEditedData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleInterestCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { value, checked } = e.target;

    setEditedData((prev) => {
      const currentInterests = prev.interests || [];
      let updatedInterests: string[];

      if (checked) {
        updatedInterests = currentInterests.includes(value)
          ? currentInterests
          : [...currentInterests, value];
      } else {
        updatedInterests = currentInterests.filter((item) => item !== value);
      }

      return {
        ...prev,
        interests: updatedInterests,
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (!file.type.startsWith("image/")) {
      alert("Please, select your photo!");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large! Max file size - 5MB.");
      return;
    }

    try {
      setIsUploadingPhoto(true);

      // uploadProfilePicture returns an object with profilePictureUrl
      let result: { profilePictureUrl: string } | string = "";

      if (file) {
        result = await matchService.uploadProfilePicture(file);
      }

      const url =
        typeof result === "string" ? result : result.profilePictureUrl;

      setProfile((prev) => (prev ? { ...prev, profilePictureUrl: url } : null));
      alert("Profile photo updated successfully");
    } catch (err) {
      console.error(`Error loading photo: ${err}`);
      alert("Falied load your photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (
      !profile ||
      !window.confirm("Are you sure to want to delete a profile photo?")
    )
      return;

    try {
      setIsUploadingPhoto(true);
      await matchService.deleteProfilePicture();

      setProfile((prev) => (prev ? { ...prev, profilePictureUrl: "" } : null));
      alert("Photo deleted!");
    } catch (err) {
      console.error(`Error deleting photo: ${err}`);
      alert("Failed deleting photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({ ...profile });
  };

  const handleSelectCity = (suggestion: CitySuggestion) => {
    setCitySearch(suggestion.display_name);
    setSuggestions([]);

    setEditedData((prev) => ({
      ...prev,
      city: suggestion.display_name,
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) return;

    try {
      setIsSaving(true);

      const updatedName = editedData.name || profile.name;

      const profileDTO = {
        aboutMe: editedData.aboutMe,
        city: editedData.city,
        age: editedData.age ? Number(editedData.age) : undefined,
        gender: editedData.gender,
        latitude: editedData.latitude,
        longitude: editedData.longitude,
        preferredDistance: editedData.preferredDistance
          ? Number(editedData.preferredDistance)
          : undefined,
      };

      const bioDTO = {
        interests: editedData.interests,
        lookingFor: editedData.lookingFor,
        favoriteFood: editedData.favoriteFood,
        favoriteMusic: editedData.favoriteMusic,
        likesLongWalks: editedData.likesLongWalks,
      };

      await matchService.updateProfile(updatedName, profileDTO, bioDTO);

      setProfile((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          ...editedData,
          profilePictureUrl: prev.profilePictureUrl,
        };
      });
      setIsEditing(false);

      alert("Profile updated successfully!");

      if (onProfileUpdate) {
        onProfileUpdate();
      }
    } catch (err) {
      console.error(`Error saving profile: ${err}`);
      alert("Failed save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const getAvatarUrl = (url: string | undefined) => {
    if (!url) return "";
    if (url.startsWith("/uploads")) {
      return `http://localhost:8080${url}`;
    }
    return url;
  };

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
      {showWarning && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 shadow-sm animate-pulse">
          <span className="text-2xl">⚡</span>
          <div>
            <h4 className="font-bold text-sm">Please complete your profile!</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Fill in your <strong>City</strong>, <strong>Gender</strong>, <strong>Age</strong>, and <strong>What you are looking for</strong> to get access to recommendations and other features.
            </p>
          </div>
        </div>
      )}
      <form
        onSubmit={handleSave}
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        <div className="md:col-span-1 bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col items-center text-center h-fit">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <div className="relative w-32 h-32 mb-4 group">
            <div
              onClick={
                isEditing && !isUploadingPhoto ? triggerFileInput : undefined
              }
              className={`w-full h-full rounded-full overflow-hidden border-4 border-gray-50 shadow-md ${
                isEditing
                  ? "cursor-pointer hover:opacity-80 transition-opacity"
                  : ""
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
              className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-white ${
                profile.isOnline ? "bg-green-500" : "bg-gray-400"
              }`}
              title={profile.isOnline ? "Online" : "Offline"}
            />
          </div>

          {isEditing && profile.profilePictureUrl && (
            <button
              type="button"
              onClick={handleDeletePhoto}
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
              <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider bg-blue-50 px-1.5 py-0.5 rounded">
                Private
              </span>
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
            className={`text-xs font-bold px-3 py-1.5 rounded-full ${
              profile.isOnline
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {profile.isOnline ? "● Active Now" : "○ Offline"}
          </span>

          <hr className="w-full my-5 border-gray-100" />

          {!isEditing ? (
            <button
              type="button"
              onClick={handleEditClick}
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
                onClick={handleCancel}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="md:col-span-2 space-y-6">
          {/* СЕКЦІЯ: About Me */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span>📝</span> About Me
            </h3>
            {isEditing ? (
              <textarea
                name="aboutMe"
                value={editedData.aboutMe || ""}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition-all"
                rows={4}
                placeholder="Write a few words about yourself..."
              />
            ) : (
              <p className="text-gray-600 leading-relaxed text-sm italic">
                {profile.aboutMe
                  ? `"${profile.aboutMe}"`
                  : "User still doesn't talk about yourself."}
              </p>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span>🔥</span> Interests & Hobbies
            </h3>
            {isEditing ? (
              <div className="space-y-3">
                <p className="text-xs text-gray-400">Select your interests:</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {AVAILABLE_INTERESTS.map((interest) => {
                    const isChecked = (editedData.interests || []).includes(
                      interest,
                    );
                    return (
                      <label
                        key={interest}
                        className="flex items-center gap-2.5 p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200/60 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          value={interest}
                          checked={isChecked}
                          onChange={handleInterestCheckboxChange}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700 select-none">
                          {interest}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : (
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
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-xl">
              <span className="text-xs text-gray-400 uppercase font-bold block mb-1">
                Looking For
              </span>
              {isEditing ? (
                <select
                  name="lookingFor"
                  value={editedData.lookingFor || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none cursor-pointer focus:border-blue-500"
                >
                  <option value="" disabled>
                    Select what are you looking for
                  </option>
                  <option value="Friends">Friends</option>
                  <option value="Relationship">Relationship</option>
                </select>
              ) : (
                <span className="text-sm font-semibold text-gray-700">
                  {profile.lookingFor || "Not specified"}
                </span>
              )}
            </div>

            <div className="p-3 bg-gray-50 rounded-xl">
              <span className="text-xs text-gray-400 uppercase font-bold block mb-1">
                Favorite Food
              </span>
              {isEditing ? (
                <input
                  type="text"
                  name="favoriteFood"
                  value={editedData.favoriteFood || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none"
                  placeholder="e.g. Pizza, Sushi"
                />
              ) : (
                <span className="text-sm font-semibold text-gray-700">
                  {profile.favoriteFood || "Not specified"}
                </span>
              )}
            </div>

            <div className="p-3 bg-gray-50 rounded-xl">
              <span className="text-xs text-gray-400 uppercase font-bold block mb-1">
                Favorite Music
              </span>
              {isEditing ? (
                <input
                  type="text"
                  name="favoriteMusic"
                  value={editedData.favoriteMusic || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none"
                  placeholder="e.g. Rock, Jazz, Pop"
                />
              ) : (
                <span className="text-sm font-semibold text-gray-700">
                  {profile.favoriteMusic || "Not specified"}
                </span>
              )}
            </div>

            <div className="p-3 bg-gray-50 rounded-xl flex flex-col justify-between">
              <span className="text-xs text-gray-400 uppercase font-bold block mb-1">
                Long Walks
              </span>
              {isEditing ? (
                <label className="inline-flex items-center gap-2 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    name="likesLongWalks"
                    checked={!!editedData.likesLongWalks}
                    onChange={handleCheckboxChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold text-gray-700 select-none">
                    Loves long walks
                  </span>
                </label>
              ) : (
                <span className="text-sm font-semibold text-gray-700">
                  {profile.likesLongWalks
                    ? "❤️ Loves long walks"
                    : "🤷‍♂️ Doesn't care much"}
                </span>
              )}
            </div>

            {isEditing && (
              <>
                <div className="p-4 bg-gray-50 rounded-2xl space-y-4">
                  <div>
                    <span className="text-xs text-gray-400 uppercase font-bold block mb-1">
                      City
                    </span>
                    {isEditing ? (
                      <div className="relative">
                        <input
                          type="text"
                          value={citySearch}
                          onChange={(e) => setCitySearch(e.target.value)}
                          className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
                          placeholder="Type city name..."
                        />

                        {suggestions.length > 0 && (
                          <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg max-h-48 overflow-y-auto shadow-lg">
                            {suggestions.map((s, index) => (
                              <li
                                key={index}
                                onClick={() => handleSelectCity(s)}
                                className="p-2 text-xs hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-none"
                              >
                                {s.display_name}
                              </li>
                            ))}
                          </ul>
                        )}
                        {isSearching && (
                          <span className="absolute right-3 top-3 text-xs text-gray-400">
                            Searching...
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm font-semibold text-gray-700 block">
                        {profile.city || "Not specified"}
                      </span>
                    )}
                  </div>

                  {(editedData.city || profile.city) && (
                    <div className="border-t border-gray-200/60 pt-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-400 uppercase font-bold">
                          Search Radius
                        </span>
                        <span className="text-xs font-bold text-blue-600">
                          {isEditing
                            ? `${editedData.preferredDistance || 50} km`
                            : `${profile.preferredDistance || 50} km`}
                        </span>
                      </div>

                      {isEditing ? (
                        <input
                          type="range"
                          name="preferredDistance"
                          min="5"
                          max="900"
                          step="5"
                          value={editedData.preferredDistance || 50}
                          onChange={handleInputChange}
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      ) : (
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          {/* Візуальна шкала у режимі перегляду */}
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{
                              width: `${((profile.preferredDistance || 50) / 150) * 100}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-xs text-gray-400 uppercase font-bold block mb-1">
                    Age
                  </span>
                  <input
                    type="number"
                    name="age"
                    value={editedData.age || ""}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none"
                    placeholder="Age"
                  />
                </div>

                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-xs text-gray-400 uppercase font-bold block mb-1">
                    Gender
                  </span>
                  {isEditing ? (
                    <select
                      name="gender"
                      value={editedData.gender || ""}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none cursor-pointer focus:border-blue-500"
                    >
                      <option value="" disabled>
                        Select your gender
                      </option>
                      <option value="male">male</option>
                      <option value="female">female</option>
                    </select>
                  ) : (
                    <span className="text-sm font-semibold text-gray-700">
                      {profile.gender || "Not specified"}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
