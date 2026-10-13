import React from "react";
import { useRecommendations } from "../features/recommendations/hooks/useRecommendations.ts";
import { RecommendationCard } from "../features/recommendations/ui/RecommendationCard.tsx";
import { FullProfileModal } from "../entities/user/ui/FullProfileModal.tsx";

export const RecommendationsPage: React.FC = () => {
  const {
    profiles,
    loading,
    selectedProfile,
    setSelectedProfile,
    handleConnect,
    handleDismiss,
  } = useRecommendations();

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
          {profiles.map((profile) => (
            <RecommendationCard
              key={profile.id}
              profile={profile}
              onSelect={() => setSelectedProfile(profile)}
              onConnect={handleConnect}
              onDismiss={handleDismiss}
            />
          ))}
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

export default RecommendationsPage;

