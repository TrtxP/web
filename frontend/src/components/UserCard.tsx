import React from 'react';
import type { AggregatedProfile } from '../services/matchService';

interface UserCardProps {
  profile: AggregatedProfile;
  onConnect: () => void;
  onDismiss: () => void;
}

export const UserCard: React.FC<UserCardProps> = ({ profile, onConnect, onDismiss }) => {
  return (
    <div className="bg-white rounded-3xl shadow-md hover:shadow-xl border border-gray-100 overflow-hidden flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1">
      
      {/* Top Banner & Profile Picture Space */}
      <div className="relative h-44 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-6xl select-none">
        {profile.profilePicture ? (
          <img 
            src={profile.profilePicture} 
            alt={profile.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-white drop-shadow-md">👤</div>
        )}
        
        {/* Dynamic Activity Badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-wider text-white uppercase">
          <span className={`w-2 h-2 rounded-full ${profile.isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
          {profile.isOnline ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* Main Biographical Summary Data Layout */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">{profile.name}</h2>
          <p className="text-gray-600 text-sm mt-2 line-clamp-3 italic">
            "{profile.aboutMe || 'This connection has not declared an profile description record snippet yet.'}"
          </p>
        </div>

        {/* Dynamic Interest Tags Space */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 block">Interests</span>
          <div className="flex flex-wrap gap-1.5">
            {profile.interests && profile.interests.length > 0 ? (
              profile.interests.map((interest) => (
                <span 
                  key={interest} 
                  className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-2.5 py-1 rounded-lg border border-indigo-100"
                >
                  {interest}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400 italic">No explicit interests indexed.</span>
            )}
          </div>
        </div>
      </div>

      {/* Primary Action Buttons Container */}
      <div className="bg-gray-50/70 p-4 border-t border-gray-100 flex gap-3">
        <button 
          onClick={onDismiss}
          className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl text-xs uppercase tracking-wider hover:bg-gray-100 active:scale-95 transition-all shadow-sm"
        >
          Dismiss
        </button>
        <button 
          onClick={onConnect}
          className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl text-xs uppercase tracking-wider hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-100"
        >
          Connect
        </button>
      </div>
    </div>
  );
};