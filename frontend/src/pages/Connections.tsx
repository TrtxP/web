import React, { useEffect, useState } from 'react';
import { matchService } from '../services/matchService';
import type { AggregatedProfile } from '../types';

const Connections: React.FC = () => {
  const [connections, setConnections] = useState<AggregatedProfile[]>([]);

  useEffect(() => {
    const loadConnections = async () => {
      try {
        const result = await matchService.getFullConnections();
        setConnections(result ?? []);
      } catch (error) {
        console.error('Failed to load connections', error);
      }
    };

    loadConnections();
  }, []);

  const handleDisconnect = async (id: number) => {
    try {
      await matchService.disconnectFromUser(id);
      setConnections(prev => prev.filter(connection => connection.id !== id));
    } catch (error) {
      console.error('Failed to disconnect from user', error);
    }
  };

  return (
    <div className="connections-page">
      <h1>Connected Users</h1>

      {connections.length === 0 ? (
        <p>No connections available.</p>
      ) : (
        <div className="connections-grid">
          {connections.map(user => (
            <div key={user.id} className="connection-card">
              <div className="connection-card-header">
                {user.profilePictureUrl ? (
                  <img src={user.profilePictureUrl} alt={user.name} className="connection-avatar" />
                ) : (
                  <div className="connection-avatar placeholder">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="connection-info">
                  <h2>{user.name}</h2>
                  {/* Замість JSON виводимо гарний статус або місто/вік */}
                  <p>{user.city}{user.age ? `, ${user.age} y.o.` : ''}</p>
                  {user.aboutMe && <p className="about-sub">{user.aboutMe}</p>}
                </div>
              </div>
              <button type="button" onClick={() => handleDisconnect(user.id)}>
                Disconnect
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Connections;