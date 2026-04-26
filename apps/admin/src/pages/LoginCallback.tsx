import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/authStore";

export function LoginCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const error = params.get("error");

      if (error) {
        console.error("Keycloak error:", error);
        navigate("/login");
        return;
      }

      if (!code) {
        console.error("No code in callback");
        navigate("/login");
        return;
      }

      try {
        const response = await api.loginWithKeycloak(code);
        useAuthStore.setState({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        navigate("/");
      } catch (err) {
        console.error("Failed to login with Keycloak:", err);
        navigate("/login");
      }
    }

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
      <div className="text-[var(--text)]">Verificando sesión...</div>
    </div>
  );
}