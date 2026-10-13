import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../shared/api/httpClient.ts";
import type { ConnectionAggregatedProfile } from "../model/types.ts";
import type { UserProfileStatusUpdate } from "../../../shared/types/common.ts";
import { connectionsApi } from "../api/connectionsApi.ts";
import { useStompSubscription } from "../../../shared/ws/useStompSubscription.ts";

export function useConnections() {
  const [connections, setConnections] = useState<
    ConnectionAggregatedProfile[]
  >([]);
  const [pendingRequests, setPendingRequests] = useState<
    ConnectionAggregatedProfile[]
  >([]);
  const [selectedProfile, setSelectedProfile] =
    useState<ConnectionAggregatedProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    let isCancelled = false;
    api
      .get<{ id: number }>("/me")
      .then((res) => {
        if (!isCancelled) {
          setCurrentUserId(res.data.id);
        }
      })
      .catch((err) =>
        console.error(`Failed to fetch current user ID: ${err}`),
      );

    return () => {
      isCancelled = true;
    };
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      const [activeResult, fullRequestsWithIds] = await Promise.all([
        connectionsApi.getFullConnections(),
        connectionsApi.getIncomingRequestsWithProfiles(),
      ]);

      setConnections(activeResult ?? []);
      setPendingRequests(fullRequestsWithIds);
    } catch (err) {
      console.error(`Failed to load connections data: ${err}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    Promise.all([
      connectionsApi.getFullConnections(),
      connectionsApi.getIncomingRequestsWithProfiles(),
    ])
      .then(([activeResult, fullRequestsWithIds]) => {
        if (!isCancelled) {
          setConnections(activeResult ?? []);
          setPendingRequests(fullRequestsWithIds);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(`Failed to load connections data: ${err}`);
        if (!isCancelled) {
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleStatusUpdate = useCallback((data: unknown) => {
    const serverData = data as { userId: number; status: string };

    console.log(
      `Received status update in Connections: ${JSON.stringify(serverData)}`,
    );

    if (!serverData) return;

    const updatedStatus: UserProfileStatusUpdate = {
      userId: serverData.userId,
      isOnline: serverData.status === "ONLINE",
      lastSeenAt: new Date().toISOString(),
    };

    setConnections((prevConnections) =>
      prevConnections.map((user) =>
        user.id === updatedStatus.userId
          ? {
              ...user,
              isOnline: updatedStatus.isOnline,
              lastSeenAt: !updatedStatus.isOnline
                ? updatedStatus.lastSeenAt
                : user.lastSeenAt,
            }
          : user,
      ),
    );

    setPendingRequests((prevRequests) =>
      prevRequests.map((user) =>
        user.id === updatedStatus.userId
          ? {
              ...user,
              isOnline: updatedStatus.isOnline,
              lastSeenAt: !updatedStatus.isOnline
                ? updatedStatus.lastSeenAt
                : user.lastSeenAt,
            }
          : user,
      ),
    );
  }, []);

  useStompSubscription("/topic/users.status", handleStatusUpdate);

  const handleConnectionEvent = useCallback(
    (data: unknown) => {
      console.log(`Received connection event: ${data}`);
      loadAllData();
    },
    [loadAllData],
  );

  useStompSubscription(
    currentUserId ? `/topic/connections.${currentUserId}` : null,
    handleConnectionEvent,
    Boolean(currentUserId),
  );

  const handleRespond = useCallback(
    async (
      connectionId: number | undefined,
      accept: boolean,
      e: React.MouseEvent,
    ) => {
      e.stopPropagation();
      if (connectionId === undefined) return;

      try {
        await connectionsApi.respondToRequest(connectionId, accept);

        setPendingRequests((prev) =>
          prev.filter((req) => req.connectionId !== connectionId),
        );

        if (accept) {
          loadAllData();
        }
      } catch (err) {
        console.error(
          `Failed to respond to connection ${connectionId}: ${err}`,
        );
      }
    },
    [loadAllData],
  );

  const handleDisconnect = useCallback(
    async (id: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!window.confirm("Are you sure you want to disconnect?")) return;

      try {
        await connectionsApi.disconnectFromUser(id);
        setConnections((prev) =>
          prev.filter((connection) => connection.id !== id),
        );
      } catch (error) {
        console.error("Failed to disconnect from user", error);
      }
    },
    [],
  );

  const handleStartChat = useCallback(
    (targetUserId: number, e: React.MouseEvent) => {
      e.stopPropagation();
      navigate(`/chat?userId=${targetUserId}`);
    },
    [navigate],
  );

  return {
    connections,
    pendingRequests,
    selectedProfile,
    setSelectedProfile,
    loading,
    loadAllData,
    handleRespond,
    handleDisconnect,
    handleStartChat,
  };
}
