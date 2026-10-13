import { api } from "../../../shared/api/httpClient.ts";
import { resolveProfileData } from "../../../entities/user/api/userApi.ts";
import type { ConnectionAggregatedProfile } from "../model/types.ts";
import type { IdResponseDTO } from "../../../shared/types/common.ts";

export const connectionsApi = {
  getConnections: async (): Promise<number[]> => {
    const res = await api.get<IdResponseDTO[]>("/connections");
    return res.data.map((item) => item.id);
  },

  getFullConnections: async (): Promise<ConnectionAggregatedProfile[]> => {
    try {
      const ids = await connectionsApi.getConnections();
      if (!ids || ids.length === 0) return [];

      const fullProfiles = await Promise.all(
        ids.map(async (id) => {
          try {
            return await resolveProfileData(id);
          } catch (err) {
            console.error(`Error loading connection data for ID ${id}: ${err}`);
            return null;
          }
        }),
      );

      return fullProfiles.filter(
        (p): p is ConnectionAggregatedProfile => p !== null,
      );
    } catch (err) {
      console.error(`Failed to load full connections: ${err}`);
      throw err;
    }
  },

  getIncomingRequests: async (): Promise<{ id: number }[]> => {
    const res = await api.get<{ id: number }[]>("/connections/requests");
    return res.data;
  },

  getIncomingRequestsWithProfiles: async (): Promise<
    ConnectionAggregatedProfile[]
  > => {
    const connectionsArray = await connectionsApi.getIncomingRequests();

    const profilePromises = connectionsArray.map(
      async (item: { id: number }): Promise<ConnectionAggregatedProfile> => {
        try {
          const connectionRes = await api.get<{ requesterId?: number }>(
            `/connections/${item.id}`,
          );
          const connectionData = connectionRes.data;
          const requesterId = connectionData.requesterId;

          if (!requesterId) {
            console.warn(
              `Failed find requester by ID in connection: ${item.id}`,
            );
            return { connectionId: item.id } as ConnectionAggregatedProfile;
          }

          const fullProfile = await resolveProfileData(requesterId);
          return {
            ...fullProfile,
            connectionId: item.id,
          };
        } catch (err) {
          console.error(`Error request handling ${item.id}: ${err}`);
          return { connectionId: item.id } as ConnectionAggregatedProfile;
        }
      },
    );

    return Promise.all(profilePromises);
  },

  connectWithUser: async (targetId: number): Promise<void> => {
    await api.post(`/connections/${targetId}`);
  },

  respondToRequest: async (
    connectionId: number,
    accept: boolean,
  ): Promise<void> => {
    await api.patch(`/connections/${connectionId}/respond?accept=${accept}`);
  },

  disconnectFromUser: async (targetId: number): Promise<void> => {
    await api.delete(`/connections/${targetId}`);
  },
};

