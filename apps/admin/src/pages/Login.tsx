import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getKeycloakAuthUrl } from "../lib/api";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const { login, register, error, isLoading, hasUsers, authMode } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (hasUsers === false && authMode === "local") {
        await register({ email, password, displayName });
      } else {
        await login({ email, password });
      }
      navigate("/");
    } catch {
      // error handled in store
    }
  }

  if (isLoading || authMode === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <div className="text-[var(--text)]">Cargando...</div>
      </div>
    );
  }

  if (authMode === "keycloak") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--panel-bg)] p-6 text-center">
          <h1 className="mb-4 text-xl font-bold text-[var(--text-h)]">Autenticación con Keycloak</h1>
          <p className="mb-4 text-sm text-[var(--text)]">
            Serás redirigido a Keycloak para iniciar sesión.
          </p>
          <button
            type="button"
            className="w-full rounded-xl bg-[var(--accent)] px-3 py-2 font-medium text-white"
            onClick={() => {
              window.location.href = getKeycloakAuthUrl();
            }}
          >
            Entrar con Keycloak
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--panel-bg)] p-6"
      >
        <h1 className="mb-6 text-xl font-bold text-[var(--text-h)]">
          {hasUsers ? "Iniciar sesión" : "Crear administrador"}
        </h1>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        ) : null}

        {!hasUsers && (
          <div className="mb-4">
            <label className="mb-1 block text-xs text-[var(--text-h)]">Nombre</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)]"
              required
            />
          </div>
        )}

        <div className="mb-4">
          <label className="mb-1 block text-xs text-[var(--text-h)]">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)]"
            required
          />
        </div>

        <div className="mb-6">
          <label className="mb-1 block text-xs text-[var(--text-h)]">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)]"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-[var(--accent)] px-3 py-2 font-medium text-white disabled:opacity-50"
        >
          {isLoading
            ? "Procesando..."
            : hasUsers
            ? "Iniciar sesión"
            : "Crear administrador"}
        </button>
      </form>
    </div>
  );
}