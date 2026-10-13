import { useState, useEffect, useCallback } from "react";
import type { AggregatedProfile } from "../../../entities/user/model/types.ts";
import type { UserProfileStatusUpdate } from "../../../shared/types/common.ts";
import { recommendationsApi } from "../api/recommendationsApi.ts";
import { connectionsApi } from "../../connections/api/connectionsApi.ts";
import { useStompSubscription } from "../../../shared/ws/useStompSubscription.ts";

export function useRecommendations() {
  const [profiles, setProfiles] = useState<AggregatedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] =
    useState<AggregatedProfile | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const profilesHydrated =
          await recommendationsApi.getFullRecommendations();
        if (!isCancelled) {
          setProfiles(profilesHydrated);
        }
      } catch (err) {
        console.error("Failed indexing recommendation assets:", err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchRecommendations();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleStatusUpdate = useCallback((data: unknown) => {
    const serverData = data as { userId: number; status: string };
    console.log(
      `Received status update in Recommendations: ${JSON.stringify(serverData)}`,
    );

    if (!serverData) return;

    const updatedStatus: UserProfileStatusUpdate = {
      userId: serverData.userId,
      isOnline: serverData.status === "ONLINE",
      lastSeenAt: new Date().toISOString(),
    };

    setProfiles((prevProfiles) =>
      prevProfiles.map((profile) =>
        profile.id === updatedStatus.userId
          ? {
              ...profile,
              isOnline: updatedStatus.isOnline,
              lastSeenAt: !updatedStatus.isOnline
                ? updatedStatus.lastSeenAt
                : profile.lastSeenAt,
            }
          : profile,
      ),
    );
  }, []);

  useStompSubscription("/topic/users.status", handleStatusUpdate);

  const handleConnect = useCallback(async (id: number) => {
    try {
      await connectionsApi.connectWithUser(id);
      setProfiles((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(`Failed to connect with user ${id}:`, err);
    }
  }, []);

  const handleDismiss = useCallback(async (id: number) => {
    try {
      await recommendationsApi.dismissRecommendation(id);
      setProfiles((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(`Failed to dismiss recommendation ${id}:`, err);
    }
  }, []);

  return {
    profiles,
    loading,
    selectedProfile,
    setSelectedProfile,
    handleConnect,
    handleDismiss,
  };
}

