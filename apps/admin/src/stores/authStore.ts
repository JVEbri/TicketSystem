import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../lib/api";
import type { User, LoginRequest, RegisterRequest } from "../types";
import { getToken, setToken, clearToken } from "../lib/token";

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hasUsers: boolean | null;
  authMode: "local" | "keycloak" | null;
  checkSetup: () => Promise<void>;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (credentials: RegisterRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  refreshIfNeeded: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      hasUsers: null,
      authMode: null,

      checkSetup: async () => {
        try {
          const { hasUsers, authMode } = await api.checkSetup();
          set({ hasUsers, authMode, isLoading: false });
        } catch {
          set({ hasUsers: false, authMode: "local", isLoading: false });
        }
      },

      register: async (credentials: RegisterRequest) => {
        set({ isLoading: true, error: null });
        try {
          await api.register(credentials);
          await get().login({ email: credentials.email, password: credentials.password });
        } catch (e) {
          const message = e instanceof Error ? e.message : "Registration failed";
          set({ error: message, isLoading: false });
          throw e;
        }
      },

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.login(credentials);
          setToken(response.token);
          set({ user: response.user, isAuthenticated: true, isLoading: false });
        } catch (e) {
          const message = e instanceof Error ? e.message : "Login failed";
          set({ error: message, isLoading: false });
          throw e;
        }
      },

      logout: () => {
        clearToken();
        set({ user: null, isAuthenticated: false, error: null });
        window.location.href = "/login";
      },

      checkAuth: async () => {
        const token = getToken();
        if (!token) {
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }

        set({ isLoading: true });
        try {
          const { user } = await api.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          clearToken();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      refreshIfNeeded: async () => {
        // TODO: implement token refresh
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        hasUsers: state.hasUsers,
        authMode: state.authMode,
      }),
    }
  )
);