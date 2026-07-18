import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Layout } from "./components/Layout";
import { Recommendations } from "./pages/Recommendations";
import { Auth } from "./pages/Auth";
import { Chat } from "./pages/Chat";
import { Profile } from "./pages/Profile";
import Connections from "./pages/Connections";
import { matchService } from "./services/matchService";
import { websocketService } from "./services/websocket";
import { type PrivateAggregatedProfile, isProfileComplete } from "./types";

function App() {
  const [profile, setProfile] = useState<PrivateAggregatedProfile | null>(null);
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState<boolean>(() => !!token);

  // Функція для оновлення стейту профілю (викликається після збереження в Profile.tsx)
  const fetchProfile = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await matchService.getMyFullProfile();
      setProfile(data);
    } catch (err) {
      console.error("Error loading profile status:", err);
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    const loadProfile = async () => {
      try {
        const data = await matchService.getMyFullProfile();
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const hasCompleteProfile = isProfileComplete(profile);

  // Створюємо безпечний fallback-профіль для компонентів на випадок, якщо дані з бекенду ще вантажаться
  const dummyProfile = {
    aboutMe: "",
    isOnline: false,
    city: "",
    age: 0,
    gender: "",
    latitude: 0,
    longitude: 0,
    preferredDistance: 50,
    recommendByCityOnly: false,
    id: "0",
    name: "User",
    lastSeenAt: undefined
  };

  // Передаємо пропси відповідно до того, що реально використовують твої файли
  const connectionUserProps = profile 
    ? { ...profile, id: String(profile.id), name: profile.name }
    : dummyProfile;


  return (
    <Router>
      {/* Layout очікує лише два пропси: children та currentUserProfile */}
      <Layout currentUserProfile={profile}>
        <Routes>
          <Route path="/login" element={<Auth />} />
          
          {/* Компонент Profile приймає ТІЛЬКИ onProfileUpdate згідно з твоїм кодом */}
          <Route
            path="/profile"
            element={<Profile onProfileUpdate={fetchProfile} />}
          />

          {/* Передаємо candidateProps (об'єкт з іменами, лімітами тощо), без зайвого user */}
          <Route
            path="/recommendations"
            element={
              token && !hasCompleteProfile ? (
                <Navigate to="/profile" state={{ forceFill: true }} replace />
              ) : (
                <Recommendations />
              )
            }
          />

          {/* Залишаємо логіку передачі пропсу user для Connections сторінки */}
          <Route
            path="/connections"
            element={
              token && !hasCompleteProfile ? (
                <Navigate to="/profile" state={{ forceFill: true }} replace />
              ) : (
                <Connections user={connectionUserProps} />
              )
            }
          />

          <Route
            path="/chat"
            element={
              token && !hasCompleteProfile ? (
                <Navigate to="/profile" state={{ forceFill: true }} replace />
              ) : (
                <Chat />
              )
            }
          />

          <Route
            path="*"
            element={token ? <Navigate to="/recommendations" replace /> : <Navigate to="/login" replace />}
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;