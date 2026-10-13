import { useState } from "react";
import { authApi, getErrorMessage } from "../api/authApi.ts";

export function useAuthForm() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isRegistering) {
        await authApi.register({ email, password });
        alert("Registration successful! Please log in with your credentials.");
        setIsRegistering(false);
        setEmail("");
        setPassword("");
      } else {
        const res = await authApi.login({ email, password });
        localStorage.setItem("token", res.token);
        window.location.href = "/recommendations";
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering((prev) => !prev);
    setError("");
  };

  return {
    isRegistering,
    email,
    password,
    error,
    loading,
    setEmail,
    setPassword,
    setError,
    handleSubmit,
    toggleMode,
  };
}

