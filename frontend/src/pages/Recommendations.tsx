import React, { useEffect, useState } from 'react';
import { matchService, resolveProfileData, type AggregatedProfile } from '../services/matchService';

export const Recommendations: React.FC = () => {
  const [profiles, setProfiles] = useState<AggregatedProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const profileIds = await matchService.getRecommendations();
        const profilesHydrated = await Promise.all(
          profileIds.slice(0, 10).map(id => resolveProfileData(id))
        );
        setProfiles(profilesHydrated);
      } catch (err) {
        console.error('Failed indexing recommendation assets:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  const handleConnect = async (id: number) => {
    await matchService.connectWithUser(id);
    setProfiles(prev => prev.filter(p => p.id !== id));
  };

  const handleDismiss = async (id: number) => {
    await matchService.dismissRecommendation(id);
    setProfiles(prev => prev.filter(p => p.id !== id));
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text)' }}>Assembling matching profiles...</div>;
  }

  return (
    <div style={{ flexGrow: 1 }}>
      <h1 style={{ textAlign: 'left', paddingLeft: '32px', marginBottom: '0' }}>Recommendations</h1>
      {profiles.length === 0 ? (
        <div style={{ margin: '32px', padding: '48px', border: '1px dashed var(--border)', borderRadius: '16px', color: 'var(--text)' }}>
          No new connections within your targeted location parameter windows.
        </div>
      ) : (
        <div className="grid-cards">
          {profiles.map(profile => (
            <div key={profile.id} className="ui-card user-card">
              
              <div className="avatar-banner">
                {profile.profilePictureUrl ? (
                  <img src={profile.profilePictureUrl} alt={profile.name} />
                ) : (
                  '👤'
                )}
              </div>

              <div className="card-content">
                <h3>{profile.name}</h3>
                <p className="biography">
                  "{profile.aboutMe || 'No customized description indexed by this user asset.'}"
                </p>

                <div className="tags-section">
                  <h4>Interests</h4>
                  <div className="tags-wrapper">
                    <h3>Not implemented yet</h3>
                  </div>
                </div>
              </div>

              <div className="card-actions">
                <button onClick={() => handleDismiss(profile.id)} className="btn-dismiss">Dismiss</button>
                <button onClick={() => handleConnect(profile.id)} className="btn-connect">Connect</button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};