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

  // Функція для оновлення стейту профілю з будь-якого дочірнього компонента (наприклад, після збереження у Profile.tsx)
  const fetchProfile = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await matchService.getMyFullProfile();
      setProfile(data);
    } catch (err) {
      console.error("Error loading profile status:", err);
    } finally {
      setLoading(false);
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

    // Initialize WebSocket connection when token is available
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

  return (
    <Router>
      {/* Передаємо стан профілю в Layout, щоб керувати навігацією */}
      <Layout profileComplete={hasCompleteProfile}>
        <Routes>
          <Route path="/login" element={<Auth />} />
          
          {/* Сторінка профілю доступна завжди, передаємо туди fetchProfile для оновлення стану після збереження */}
          <Route path="/profile" element={<Profile onProfileUpdate={fetchProfile} />} />

          {/* Захищені роути: якщо профіль не заповнено — редирект на /profile */}
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
          <Route
            path="/connections"
            element={
              token && !hasCompleteProfile ? (
                <Navigate to="/profile" state={{ forceFill: true }} replace />
              ) : (
                <Connections />
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