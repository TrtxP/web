import React from "react";
import { useConnections } from "../features/connections/hooks/useConnections.ts";
import { PendingRequestCard } from "../features/connections/ui/PendingRequestCard.tsx";
import { ConnectedUserCard } from "../features/connections/ui/ConnectedUserCard.tsx";
import { FullProfileModal } from "../entities/user/ui/FullProfileModal.tsx";
import type { ConnectionCardProps } from "../features/connections/model/types.ts";

export const ConnectionsPage: React.FC<ConnectionCardProps> = () => {
  const {
    connections,
    pendingRequests,
    selectedProfile,
    setSelectedProfile,
    loading,
    handleRespond,
    handleDisconnect,
    handleStartChat,
  } = useConnections();

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        Loading your connections...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {pendingRequests.length > 0 && (
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">
            Pending Requests
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {pendingRequests.map((user) => (
              <PendingRequestCard
                key={user.connectionId ?? user.id}
                user={user}
                onSelect={() => setSelectedProfile(user)}
                onRespond={handleRespond}
              />
            ))}
          </div>
        </div>
      )}

      <h2 className="text-4xl font-bold mb-6 text-gray-800">Connected Users</h2>

      {connections.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400">
          No active connections yet. Start matching!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {connections.map((user) => (
            <ConnectedUserCard
              key={user.id}
              user={user}
              onSelect={() => setSelectedProfile(user)}
              onDisconnect={handleDisconnect}
              onStartChat={handleStartChat}
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

export default ConnectionsPage;

