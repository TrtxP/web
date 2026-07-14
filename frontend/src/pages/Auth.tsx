import React, { useState } from "react";
import { api } from "../services/matchService";

export const Auth: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    if (!email.includes("@")) {
      setError('Please enter a valid email address containing "@".');
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }
    setError("");
    return true;
  };

  const getErrorMessage = (error: unknown) => {
    const defaultMessage = "Authentication failed. Please try again.";

    if (error instanceof Error && error.message) {
      return error.message;
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      typeof (error as { response?: unknown }).response === "object" &&
      (error as { response: { data?: unknown } }).response !== null
    ) {
      const data = (error as { response: { data?: unknown } }).response.data;
      if (
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof (data as { message?: unknown }).message === "string"
      ) {
        return (data as { message: string }).message;
      }
    }

    return defaultMessage;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const endpoint = isRegistering ? "/auth/register" : "/auth/login";

    try {
      // Expects backend to return a DTO containing a JWT string token
      const res = await api.post<{ token: string }>(endpoint, {
        email,
        password,
      });

      if (isRegistering) {
        alert("Registration successful! Please log in with your credentials.");
        setIsRegistering(false);
        setEmail("");
        setPassword("");
      } else {
        localStorage.setItem("token", res.data.token);
        window.location.href = "/recommendations";
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-indigo-600 tracking-tight">
            ⚡ match-me
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {isRegistering
              ? "Create an account to start matching"
              : "Welcome back! Sign in to your account"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-xs font-semibold">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
              Email Address
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition bg-gray-50"
              placeholder="you@domain.com"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition bg-gray-50"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 flex justify-center items-center text-sm disabled:opacity-50 p-5"
          >
            {loading
              ? "Processing..."
              : isRegistering
                ? "Register Account"
                : "Log In"}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError("");
            }}
            className="text-indigo-600 hover:text-indigo-700 text-xs font-bold focus:outline-none"
          >
            {isRegistering
              ? "Already have an account? Log In"
              : "Don't have an account yet? Register"}
          </button>
        </div>
      </div>
    </div>
  );
};
