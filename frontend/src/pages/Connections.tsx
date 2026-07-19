import React, { useEffect, useState } from "react";
import {
  matchService,
  api,
  resolveProfileData,
} from "../services/matchService";
import { FullProfileModal } from "../components/FullProfileModal";
import { useNavigate } from "react-router-dom"; // Для швидкого переходу в чат
import type {
  ConnectionAggregatedProfile,
  ConnectionCardProps,
  UserProfileStatusUpdate,
} from "../types";
import { getUserStatus } from "../utils/date";
import { websocketService } from "../services/websocket";

const Connections: React.FC<ConnectionCardProps> = () => {
  const [connections, setConnections] = useState<ConnectionAggregatedProfile[]>(
    [],
  );
  const [selectedProfile, setSelectedProfile] =
    useState<ConnectionAggregatedProfile | null>(null);

  const [pendingRequests, setPendingRequests] = useState<
    ConnectionAggregatedProfile[]
  >([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadAllData = async () => {
    try {
      setLoading(true);

      const activeResult = await matchService.getFullConnections();
      setConnections(activeResult ?? []);

      const requestsResponse = await api.get("/connections/requests");
      const connectionsArray = requestsResponse.data;

      const profilePromises = connectionsArray.map(
        async (item: { id: number }) => {
          try {
            const connectionRes = await api.get(`/connections/${item.id}`);
            const connectionData = connectionRes.data;

            // Використовуємо безпечний виклик ?. та фолбек на випадок, якщо requester або receiver порожні
            const requesterId = connectionData.requesterId;

            if (!requesterId) {
              console.warn(
                `Failed find requester by ID in connection: ${item.id}`,
              );
              return { connectionId: item.id }; // повертаємо хоча б ID з'єднання, щоб цикл не ламався
            }

            const fullProfile = await resolveProfileData(requesterId);

            return {
              ...fullProfile,
              connectionId: item.id,
            };
          } catch (err) {
            console.error(`Error request handling ${item.id}: ${err}`);
            return { connectionId: item.id };
          }
        },
      );

      const fullRequestsWithIds = await Promise.all(profilePromises);
      setPendingRequests(fullRequestsWithIds);
    } catch (err) {
      console.error(`Failed to load connections data: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await loadAllData();
    };
    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = websocketService.subscribe(
      `/topic/users.status`,
      (data: unknown) => {
        const serverData = data as { userId: number; status: string };
        console.log(
          `Received status update in Connections: ${JSON.stringify(serverData)}`,
        );

        if (!serverData) return;

        const updatedStatus: UserProfileStatusUpdate = {
          userId: serverData.userId,
          isOnline: serverData.status === 'ONLINE',
          lastSeenAt: new Date().toISOString()
        }

        setConnections((prevConnections) =>
          prevConnections.map((user) =>
            user.id === updatedStatus.userId
              ? {
                  ...user,
                  isOnline: updatedStatus.isOnline,
                  lastSeenAt:
                    !updatedStatus.isOnline
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
                  lastSeenAt:
                    !updatedStatus.isOnline
                      ? updatedStatus.lastSeenAt
                      : user.lastSeenAt,
                }
              : user,
          ),
        );
      },
    );

    return () => unsubscribe();
  }, []);

  const handleRespond = async (
    connectionId: number,
    accept: boolean,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();

    try {
      await api.patch(`/connections/${connectionId}/respond?accept=${accept}`);

      setPendingRequests((prev) =>
        prev.filter(
          (req: ConnectionAggregatedProfile) =>
            req.connectionId !== connectionId,
        ),
      );

      if (accept) {
        loadAllData();
      }
    } catch (err) {
      console.error(`Failed to respond to connection ${connectionId}: ${err}`);
    }
  };

  const handleDisconnect = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Щоб не відкривалася модалка при кліку на кнопку
    if (!window.confirm("Are you sure you want to disconnect?")) return;
    try {
      await matchService.disconnectFromUser(id);
      setConnections((prev) =>
        prev.filter((connection) => connection.id !== id),
      );
    } catch (error) {
      console.error("Failed to disconnect from user", error);
    }
  };

  const handleStartChat = (targetUserId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    // Перенаправляємо користувача на сторінку чату і передаємо ID того, з ким хочемо поспілкуватися
    navigate(`/chat?userId=${targetUserId}`);
  };

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
            {pendingRequests.map((user) => {
              const status = getUserStatus(!!user.isOnline, user.lastSeenAt);

              return (
                <div
                  key={user.connectionId}
                  onClick={() => setSelectedProfile(user)}
                  className="bg-white rounded-2xl shadow-md border border-amber-100 p-5 flex flex-col items-center text-center transition-transform hover:-translate-y-1 cursor-pointer"
                >
                  {/* Рендеринг Аватара користувача (копіюєш свій існуючий JSX для аватара) */}
                  <div className="relative w-28 h-28 mb-4">
                    {user.profilePictureUrl ? (
                      <img
                        src={user.profilePictureUrl}
                        alt={user.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-4xl font-bold">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span
                      className={`status ${status.isOnline ? "status-success" : "status-warning"}`}
                      title={status.isOnline ? "Online" : "Offline"}
                    ></span>
                  </div>

                  {/* Інформація про користувача (копіюєш свій існуючий JSX для інфо) */}
                  <div className="mb-4 w-full">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {user.name}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      📍 {user.city || "Not specified"}
                    </p>
                  </div>

                  {/* Унікальні Кнопки дій для підтвердження або відхилення */}
                  <div className="flex gap-3 w-full mt-auto">
                    <button
                      onClick={(e) =>
                        handleRespond(user.connectionId, false, e)
                      }
                      className="flex-1 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-500 border border-transparent hover:border-red-200 font-semibold py-2 rounded text-sm transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={(e) => handleRespond(user.connectionId, true, e)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded text-sm transition-colors"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              );
            })}
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
          {connections.map((user) => {
            const status = getUserStatus(!!user.isOnline, user.lastSeenAt);

            return (
              <div
                key={user.id}
                onClick={() => setSelectedProfile(user)}
                className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 flex flex-col items-center text-center transition-transform hover:-translate-y-1 cursor-pointer"
              >
                {/* Аватар */}
                <div className="relative w-28 h-28 mb-4">
                  {user.profilePictureUrl ? (
                    <img
                      src={user.profilePictureUrl}
                      alt={user.name}
                      className="w-full h-full object-cover rounded-full border-2 border-white shadow-sm"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-4xl font-bold shadow-inner">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span
                    className={`status ${status.isOnline ? "status-success" : "status-warning"}`}
                    title={status.isOnline ? "Online" : "Offline"}
                  />
                </div>

                {/* Інфо */}
                <div className="mb-4 w-full">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {user.name}
                    {user.age ? `, ${user.age}` : ""}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    📍 {user.city || "Not specified"}
                  </p>
                  <p className="text-sm text-gray-500 italic mt-2 line-clamp-2">
                    {user.aboutMe ? `"${user.aboutMe}"` : "No bio shared."}
                  </p>
                </div>

                {/* Кнопки дій */}
                <div className="flex gap-3 w-full mt-auto">
                  <button
                    onClick={(e) => handleDisconnect(user.id, e)}
                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 rounded text-sm transition-colors"
                  >
                    Disconnect
                  </button>
                  <button
                    onClick={(e) => handleStartChat(user.id, e)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded text-sm transition-colors"
                  >
                    Start Chat
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Модалка детального перегляду */}
      {selectedProfile && (
        <FullProfileModal
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </div>
  );
};

export default Connections;
