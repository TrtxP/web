import React, { useEffect, useState } from 'react';
import { matchService } from '../services/matchService';
import { FullProfileModal } from '../components/FullProfileModal';
import { useNavigate } from 'react-router-dom'; // Для швидкого переходу в чат
import type { AggregatedProfile } from '../types';

const Connections: React.FC = () => {
  const [connections, setConnections] = useState<AggregatedProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<AggregatedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadConnections = async () => {
      try {
        const result = await matchService.getFullConnections();
        setConnections(result ?? []);
      } catch (error) {
        console.error('Failed to load connections', error);
      } finally {
        setLoading(false);
      }
    };
    loadConnections();
  }, []);

  const handleDisconnect = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Щоб не відкривалася модалка при кліку на кнопку
    if (!window.confirm("Are you sure you want to disconnect?")) return;
    try {
      await matchService.disconnectFromUser(id);
      setConnections(prev => prev.filter(connection => connection.id !== id));
    } catch (error) {
      console.error('Failed to disconnect from user', error);
    }
  };

  const handleStartChat = (targetUserId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    // Перенаправляємо користувача на сторінку чату і передаємо ID того, з ким хочемо поспілкуватися
    navigate(`/chat?userId=${targetUserId}`);
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading your connections...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-4xl font-bold mb-6 text-gray-800">Connected Users</h2>

      {connections.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400">
          No active connections yet. Start matching!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {connections.map(user => (
            <div 
              key={user.id} 
              onClick={() => setSelectedProfile(user)}
              className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 flex flex-col items-center text-center transition-transform hover:-translate-y-1 cursor-pointer"
            >
              {/* Аватар */}
              <div className="relative w-28 h-28 mb-4">
                {user.profilePictureUrl ? (
                  <img src={user.profilePictureUrl} alt={user.name} className="w-full h-full object-cover rounded-full border-2 border-white shadow-sm" />
                ) : (
                  <div className="w-full h-full rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-4xl font-bold shadow-inner">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${user.isOnline ? "bg-green-500" : "bg-gray-400"}`} />
              </div>

              {/* Інфо */}
              <div className="mb-4 w-full">
                <h3 className="text-2xl font-bold text-gray-900 line-clamp-1">{user.name}{user.age ? `, ${user.age}` : ''}</h3>
                <p className="text-sm text-gray-400 mt-1">📍 {user.city || "Not specified"}</p>
                <p className="text-sm text-gray-500 italic mt-2 line-clamp-2">
                  {user.aboutMe ? `"${user.aboutMe}"` : "No bio shared."}
                </p>
              </div>

              {/* Кнопки дій */}
              <div className="flex gap-3 w-full mt-auto">
                <button
                  onClick={(e) => handleDisconnect(user.id, e)}
                  className="flex-1 bg-white hover:bg-red-50 text-red-500 border border-red-200 font-semibold py-2 rounded text-sm transition-colors"
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
          ))}
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