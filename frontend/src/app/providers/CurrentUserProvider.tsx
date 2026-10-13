import React, { useEffect, useState, useCallback } from "react";
import type { PrivateAggregatedProfile } from "../../entities/user/model/types.ts";
import { getMyFullProfile } from "../../entities/user/api/userApi.ts";
import { websocketService } from "../../shared/ws/websocketService.ts";
import { CurrentUserContext } from "./CurrentUserContext.ts";

export const CurrentUserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [profile, setProfile] = useState<PrivateAggregatedProfile | null>(null);
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState<boolean>(() => !!token);

  const refetchProfile = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await getMyFullProfile();
      setProfile(data);
    } catch (err) {
      console.error("Error loading profile status:", err);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    const loadProfile = async () => {
      try {
        const data = await getMyFullProfile();
        if (active) {
          setProfile(data);
        }
      } catch (err) {
        console.error("Error loading profile status:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProfile();
    websocketService.connect(token);

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <CurrentUserContext.Provider
      value={{
        profile,
        token,
        loading,
        refetchProfile,
      }}
    >
      {children}
    </CurrentUserContext.Provider>
  );
};

