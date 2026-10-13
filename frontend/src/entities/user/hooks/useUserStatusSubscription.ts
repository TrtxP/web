import { useCallback } from "react";
import { useStompSubscription } from "../../../shared/ws/useStompSubscription.ts";
import type { UserProfileStatusUpdate } from "../../../shared/types/common.ts";

export function useUserStatusSubscription(
  onStatusUpdate: (update: UserProfileStatusUpdate) => void,
  enabled = true,
): void {
  const handleMessage = useCallback(
    (rawPayload: unknown) => {
      const serverData = rawPayload as { userId: number; status: string };
      if (!serverData || typeof serverData.userId === "undefined") return;

      const update: UserProfileStatusUpdate = {
        userId: Number(serverData.userId),
        isOnline: serverData.status === "ONLINE",
        lastSeenAt:
          serverData.status === "OFFLINE"
            ? new Date().toISOString()
            : "",
      };

      onStatusUpdate(update);
    },
    [onStatusUpdate],
  );

  useStompSubscription("/topic/users.status", handleMessage, enabled);
}

