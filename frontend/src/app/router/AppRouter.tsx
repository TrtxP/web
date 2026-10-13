import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "../../shared/ui/Layout.tsx";
import { AuthPage } from "../../pages/AuthPage.tsx";
import { ProfilePage } from "../../pages/ProfilePage.tsx";
import { RecommendationsPage } from "../../pages/RecommendationsPage.tsx";
import { ConnectionsPage } from "../../pages/ConnectionsPage.tsx";
import { ChatPage } from "../../pages/ChatPage.tsx";
import { ProtectedRoute } from "./ProtectedRoute.tsx";
import { useCurrentUser } from "../providers/useCurrentUser.ts";

export const AppRouter: React.FC = () => {
  const { profile, token, loading, refetchProfile } = useCurrentUser();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Layout currentUserProfile={profile}>
      <Routes>
        <Route path="/login" element={<AuthPage />} />

        <Route
          path="/profile"
          element={<ProfilePage onProfileUpdate={refetchProfile} />}
        />

        <Route
          path="/recommendations"
          element={
            <ProtectedRoute>
              <RecommendationsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/connections"
          element={
            <ProtectedRoute>
              <ConnectionsPage onProfileUpdate={refetchProfile} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            token ? (
              <Navigate to="/recommendations" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Layout>
  );
};

