import React, { useId } from "react";
import { useAuthForm } from "../hooks/useAuthForm.ts";

export const AuthForm: React.FC = () => {
  const {
    isRegistering,
    email,
    password,
    isPasswordVisible,
    togglePasswordVisibility,
    fieldErrors,
    error,
    loading,
    setEmail,
    setPassword,
    handleSubmit,
    toggleMode,
  } = useAuthForm();
  const formId = useId();
  const emailId = `${formId}-email`;
  const passwordId = `${formId}-password`;
  const errorId = `${formId}-error`;
  const passwordAction = isPasswordVisible ? "Hide password" : "Show password";

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <section
        aria-labelledby={`${formId}-heading`}
        aria-describedby={`${formId}-description`}
        className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-md w-full space-y-6"
      >
        <div className="text-center">
          <h1 id={`${formId}-heading`} className="text-3xl font-extrabold text-indigo-600 tracking-tight">
            <span aria-hidden="true">⚡</span> match-me
          </h1>
          <p id={`${formId}-description`} className="text-gray-500 text-sm mt-2">
            {isRegistering
              ? "Create an account to start matching"
              : "Welcome back! Sign in to your account"}
          </p>
        </div>

        {error && (
          <div id={errorId} role="alert" aria-atomic="true" className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-xs font-semibold">
            <span aria-hidden="true">⚠️</span> {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
          aria-label={isRegistering ? "Create an account" : "Sign in"}
          aria-busy={loading}
          aria-describedby={error ? errorId : undefined}
          className="space-y-4"
        >
          <div>
            <label htmlFor={emailId} className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
              Email Address
            </label>
            <input
              id={emailId}
              name="email"
              type="email"
              autoComplete={isRegistering ? "email" : "username"}
              autoCapitalize="none"
              spellCheck={false}
              required
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? `${emailId}-error` : undefined}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition bg-gray-50"
              placeholder="you@domain.com"
              disabled={loading}
            />
            {fieldErrors.email && <span id={`${emailId}-error`} className="sr-only">{fieldErrors.email}</span>}
          </div>

          <div>
            <label htmlFor={passwordId} className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id={passwordId}
                name="password"
                type={isPasswordVisible ? "text" : "password"}
                autoComplete={isRegistering ? "new-password" : "current-password"}
                autoCapitalize="none"
                spellCheck={false}
                required
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? `${passwordId}-error` : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-4 pr-14 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition bg-gray-50"
                placeholder="••••••••"
                disabled={loading}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                disabled={loading}
                aria-label={passwordAction}
                aria-controls={passwordId}
                title={passwordAction}
                className="absolute right-1 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 transition hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg aria-hidden="true" focusable="false" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  {isPasswordVisible ? (
                    <>
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  ) : (
                    <path d="M3 9a10 10 0 0 0 18 0M5 12l-2 2m6-1-1 3m6-3 1 3m4-4 2 2" />
                  )}
                </svg>
              </button>
            </div>
            {fieldErrors.password && <span id={`${passwordId}-error`} className="sr-only">{fieldErrors.password}</span>}
          </div>

          <button
            type="submit"
            aria-label={loading ? "Processing request" : isRegistering ? "Register Account" : "Log In"}
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
            onClick={toggleMode}
            disabled={loading}
            className="text-indigo-600 hover:text-indigo-700 text-xs font-bold rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {isRegistering
              ? "Already have an account? Log In"
              : "Don't have an account yet? Register"}
          </button>
        </div>
      </section>
    </div>
  );
};

