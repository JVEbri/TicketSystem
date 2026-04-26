import { useAuthStore } from "../stores/authStore";

export function useAuth() {
  const store = useAuthStore();
  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    hasUsers: store.hasUsers,
    authMode: store.authMode,
    checkSetup: store.checkSetup,
    login: store.login,
    register: store.register,
    logout: store.logout,
    checkAuth: store.checkAuth,
  };
}