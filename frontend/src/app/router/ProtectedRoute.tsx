import React from "react";
import { Navigate } from "react-router-dom";
import { useCurrentUser } from "../providers/useCurrentUser.ts";

interface ProtectedRouteProps {
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { token } = useCurrentUser();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

