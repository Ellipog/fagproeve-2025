"use client";

import { useState } from "react";

interface User {
  id: string;
  email: string;
  createdAt: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
  error?: string;
  details?: string[];
}

interface AuthFormProps {
  onAuthSuccess: (user: User, token: string) => void;
}

export default function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint =
        authMode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.token && data.user) {
        localStorage.setItem("token", data.token);
        onAuthSuccess(data.user, data.token);
        setEmail("");
        setPassword("");
      } else {
        setError(data.error || "Authentication failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              {authMode === "login" ? "Sign In" : "Create Account"}
            </h1>
            <p className="text-gray-600 text-sm">
              {authMode === "login"
                ? "Welcome back! Please sign in to continue."
                : "Get started with your document management."}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
            >
              {loading
                ? authMode === "login"
                  ? "Signing in..."
                  : "Creating account..."
                : authMode === "login"
                ? "Sign In"
                : "Sign Up"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              {authMode === "login"
                ? "Don't have an account?"
                : "Already have an account?"}
              <button
                onClick={() => {
                  setAuthMode(authMode === "login" ? "signup" : "login");
                  setError("");
                }}
                className="ml-1 text-blue-600 hover:text-blue-800 font-medium"
              >
                {authMode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
