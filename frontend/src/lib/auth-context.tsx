"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { API_BASE_URL } from "./api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string;
  country_code: string;
  role: string;
  is_verified: boolean;
  created_at: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    countryCode: string,
    phone: string,
    otp: string,
  ) => Promise<void>;
  register: (
    countryCode: string,
    phone: string,
    otp: string,
    name?: string,
    email?: string,
  ) => Promise<void>;
  logout: () => void;
  requestLoginOtp: (
    countryCode: string,
    phone: string,
  ) => Promise<void>;
  requestRegisterOtp: (
    countryCode: string,
    phone: string,
  ) => Promise<void>;
}

// ─── Custom error class for API errors ──────────────────────────────────────

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Type guard to check whether a thrown value is an ApiError.
 * Used in catch blocks to display server-returned error messages.
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

// ─── Token storage helpers ──────────────────────────────────────────────────

const TOKEN_KEY = "scriptpal_token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null;

  // Fetch current user on mount (if a token exists)
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetchCurrentUser(token)
      .then((u) => setUser(u))
      .catch(() => {
        removeToken();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // ─── Auth methods ─────────────────────────────────────────────────────────

  const requestLoginOtp = useCallback(
    async (countryCode: string, phone: string) => {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/request-login-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country_code: countryCode, phone }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ApiError(body.detail || "Failed to send login OTP");
      }
    },
    [],
  );

  const requestRegisterOtp = useCallback(
    async (countryCode: string, phone: string) => {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country_code: countryCode, phone }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ApiError(body.detail || "Failed to send registration OTP");
      }
    },
    [],
  );

  const login = useCallback(
    async (countryCode: string, phone: string, otp: string) => {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country_code: countryCode,
          phone,
          code: otp,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ApiError(body.detail || "Login failed");
      }

      const { access_token } = await res.json();
      setToken(access_token);

      const currentUser = await fetchCurrentUser(access_token);
      setUser(currentUser);
    },
    [],
  );

  const register = useCallback(
    async (
      countryCode: string,
      phone: string,
      otp: string,
      name?: string,
      email?: string,
    ) => {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country_code: countryCode,
          phone,
          code: otp,
          name,
          email,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ApiError(body.detail || "Registration failed");
      }

      // Registration succeeded but does NOT return a JWT token.
      // The user must now log in with a new OTP.
      throw new Error("REGISTERED_NEEDS_LOGIN");
    },
    [],
  );

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        requestLoginOtp,
        requestRegisterOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

async function fetchCurrentUser(
  token: string,
): Promise<AuthUser> {
  const res = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch current user");
  }

  return res.json();
}
