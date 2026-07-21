import React, { useEffect, useState } from "react";
import { matchService, resolveProfileData } from "../services/matchService";
import { FullProfileModal } from "../components/FullProfileModal";
import type { AggregatedProfile, UserProfileStatusUpdate } from "../types";
import { getUserStatus } from "../utils/date";
import { websocketService } from "../services/websocket";

// Рендеримо як компонент без вхідних пропсів (як сторінку)
export const Recommendations: React.FC = () => {
  const [profiles, setProfiles] = useState<AggregatedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<AggregatedProfile | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const profileIds = await matchService.getRecommendations();
        const profilesHydrated = await Promise.all(
          profileIds.map((id) => resolveProfileData(id)),
        );
        setProfiles(profilesHydrated);
      } catch (err) {
        console.error("Failed indexing recommendation assets:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  useEffect(() => {
    const unsubscribe = websocketService.subscribe(`/topic/users.status`, (data: unknown) => {
      const serverData = data as {userId: number; status: string}
      console.log(`Received status update in Recommendations: ${JSON.stringify(serverData)}`)

      if (!serverData) return

      const updatedStatus: UserProfileStatusUpdate = {
        userId: serverData.userId,
        isOnline: serverData.status === 'ONLINE',
        lastSeenAt: new Date().toISOString()
      }

      setProfiles((prevProfiles) =>
        prevProfiles.map((profile) =>
          profile.id === updatedStatus.userId ? {
            ...profile,
            isOnline: updatedStatus.isOnline,
            lastSeenAt: !updatedStatus.isOnline ? updatedStatus.lastSeenAt : profile.lastSeenAt
          } : profile
        ) 
      )
    })

    return () => unsubscribe()
  }, [])

  const handleConnect = async (id: number) => {
    await matchService.connectWithUser(id);
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDismiss = async (id: number) => {
    await matchService.dismissRecommendation(id);
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "48px", color: "var(--text)" }}>
        Assembling matching profiles...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Recommendations</h2>
      {profiles.length === 0 ? (
        <div
          style={{
            margin: "32px",
            padding: "48px",
            border: "1px dashed var(--border)",
            borderRadius: "16px",
            color: "var(--text)",
          }}
        >
          No new connections within your targeted location parameter windows.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {profiles.map((profile) => {
            // Рахуємо статус Окремо для кожного профілю у списку!
            const status = getUserStatus(!!profile.isOnline, profile.lastSeenAt);

            return (
              <div
                key={profile.id}
                onClick={() => setSelectedProfile(profile)}
                className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 flex flex-col items-center text-center transition-transform hover:-translate-y-1 cursor-pointer"
              >
                <div className="relative w-28 h-28 mb-4">
                  {profile.profilePictureUrl ? (
                    <img
                      src={profile.profilePictureUrl}
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
                      handleDismiss(profile.id);
                    }}
                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 rounded text-sm transition-colors"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConnect(profile.id);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded text-sm transition-colors"
                  >
                    Connect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedProfile && (
        <FullProfileModal
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </div>
  );
};