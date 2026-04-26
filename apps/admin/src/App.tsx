import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { Login } from "./pages/Login";
import { LoginCallback } from "./pages/LoginCallback";
import { Dashboard } from "./pages/Dashboard";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <div className="text-[var(--text)]">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { checkSetup, checkAuth } = useAuth();

  useEffect(() => {
    // Always check setup on mount (it's fast and ensures authMode is correct)
    checkSetup().then(() => {
      // Verify auth only if we have a token in localStorage
      const token = localStorage.getItem("auth_token");
      if (token) {
        checkAuth();
      }
    });
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/login/callback" element={<LoginCallback />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;