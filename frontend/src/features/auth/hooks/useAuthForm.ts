import { useState } from "react";
import { authApi, getErrorMessage } from "../api/authApi.ts";

export function useAuthForm() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const nextFieldErrors: typeof fieldErrors = {};
    if (!email.includes("@")) {
      nextFieldErrors.email = 'Please enter a valid email address containing "@".';
    }
    if (password.length < 6) {
      nextFieldErrors.password = "Password must be at least 6 characters long.";
    }
    setFieldErrors(nextFieldErrors);
    const validationError = nextFieldErrors.email || nextFieldErrors.password;
    if (validationError) {
      setError(validationError);
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
        setIsPasswordVisible(false);
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
    setFieldErrors({});
    setIsPasswordVisible(false);
  };

  return {
    isRegistering,
    email,
    password,
    isPasswordVisible,
    togglePasswordVisibility: () => setIsPasswordVisible((visible) => !visible),
    fieldErrors,
    error,
    loading,
    setEmail: (value: string) => {
      setEmail(value);
      setFieldErrors((previous) => ({ ...previous, email: undefined }));
      setError("");
    },
    setPassword: (value: string) => {
      setPassword(value);
      setFieldErrors((previous) => ({ ...previous, password: undefined }));
      setError("");
    },
    setError,
    handleSubmit,
    toggleMode,
  };
}

