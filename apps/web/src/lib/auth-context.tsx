/**
 * KALEN Auth Context
 * Provides authentication state and methods throughout the app.
 * Uses WebAuthn/Passkeys for human authentication.
 */

"use client";

import React, { createContext, useCallback, useEffect, useRef, useState } from "react";
import type { AuthState, DualIdentity } from "./types";
import { apiClient } from "./api-client";
import { socketClient } from "./socket";

const AUTH_STORAGE_KEY = "kalen_auth";

interface AuthContextValue extends AuthState {
  login: (email: string) => Promise<void>;
  register: (email: string, displayName: string) => Promise<void>;
  logout: () => void;
}

function loadStoredAuth(): AuthState {
  if (typeof window === "undefined") {
    return {
      isAuthenticated: false,
      isLoading: true,
      identity: null,
      accessToken: null,
      refreshToken: null,
    };
  }

  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AuthState;
      if (parsed.accessToken && parsed.identity) {
        return {
          ...parsed,
          isLoading: false,
        };
      }
    }
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  return {
    isAuthenticated: false,
    isLoading: false,
    identity: null,
    accessToken: null,
    refreshToken: null,
  };
}

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  identity: null,
  accessToken: null,
  refreshToken: null,
};

export const AuthContext = createContext<AuthContextValue>({
  ...initialState,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(loadStoredAuth);
  const initializedRef = useRef(false);

  // Side effects for restoring auth (socket connection, API client)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (state.accessToken) {
      apiClient.setAccessToken(state.accessToken);
      socketClient.connect(state.accessToken);
    }
  }, [state.accessToken]);

  const login = useCallback(async (email: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Step 1: Begin authentication - get challenge from server
      const beginResponse = await apiClient.beginAuthentication(email);
      if (!beginResponse.success || !beginResponse.data) {
        throw new Error(beginResponse.error || "Failed to begin authentication");
      }

      // Step 2: Use WebAuthn API to sign the challenge
      // TODO: Implement with @simplewebauthn/browser when server is ready
      // For now, simulate successful login
      const simulatedIdentity: DualIdentity = {
        kind: "human",
        identity: {
          userId: "user-simulated",
          email,
          displayName: email.split("@")[0],
          passkeyCredentialId: "simulated-credential-id",
          publicKey: "simulated-public-key",
          createdAt: new Date().toISOString(),
        },
      };

      const newState: AuthState = {
        isAuthenticated: true,
        isLoading: false,
        identity: simulatedIdentity,
        accessToken: "simulated-access-token",
        refreshToken: "simulated-refresh-token",
      };

      setState(newState);
      apiClient.setAccessToken(newState.accessToken);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newState));

      // Connect to WebSocket
      socketClient.connect(newState.accessToken!);
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const register = useCallback(async (email: string, displayName: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Step 1: Begin registration - get challenge from server
      const beginResponse = await apiClient.beginRegistration(email, displayName);
      if (!beginResponse.success || !beginResponse.data) {
        throw new Error(beginResponse.error || "Failed to begin registration");
      }

      // Step 2: Use WebAuthn API to create a credential
      // TODO: Implement with @simplewebauthn/browser when server is ready
      // For now, simulate successful registration
      const simulatedIdentity: DualIdentity = {
        kind: "human",
        identity: {
          userId: "user-new-" + Date.now(),
          email,
          displayName,
          passkeyCredentialId: "simulated-credential-id-" + Date.now(),
          publicKey: "simulated-public-key-" + Date.now(),
          createdAt: new Date().toISOString(),
        },
      };

      const newState: AuthState = {
        isAuthenticated: true,
        isLoading: false,
        identity: simulatedIdentity,
        accessToken: "simulated-access-token-" + Date.now(),
        refreshToken: "simulated-refresh-token-" + Date.now(),
      };

      setState(newState);
      apiClient.setAccessToken(newState.accessToken);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newState));

      // Connect to WebSocket
      socketClient.connect(newState.accessToken!);
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    socketClient.disconnect();
    apiClient.setAccessToken(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setState({
      isAuthenticated: false,
      isLoading: false,
      identity: null,
      accessToken: null,
      refreshToken: null,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
