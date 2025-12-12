// src/App.tsx
import { useEffect, useState } from "react";
import { AppShell } from "./app/AppShell";
import "./App.css";
import LoginPage from "./pages/auth/LoginPage";

export type Theme = "light" | "dark";

export interface Team {
  id: string;
  name: string;
  publicKey?: string | null;
  widget?: any;
}

interface MeResponse {
  user: { id: string; email: string; name: string };
  team: Team;
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function readInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem("CHATAPP_THEME");
  if (stored === "light" || stored === "dark") return stored;

  if (window.matchMedia?.("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return "dark";
}

function readInitialToken(): string | null {
  if (typeof window === "undefined") return null;
  // Support both legacy and new keys, just in case
  return (
    window.localStorage.getItem("CHATAPP_TOKEN") ||
    window.localStorage.getItem("CHATAPP_TOKEN")
  );
}

export function App() {
  const [theme, setTheme] = useState<Theme>(() => readInitialTheme());
  const [token, setToken] = useState<string | null>(() => readInitialToken());
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState<boolean>(!!token);
  const [error, setError] = useState<string | null>(null);

  // persist theme
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("CHATAPP_THEME", theme);
      document.documentElement.dataset.theme = theme;
    }
  }, [theme]);

  // load /auth/me-full when token changes
  useEffect(() => {
    if (!token) {
      setTeam(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchMe() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/auth/me-full`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401 || res.status === 403) {
          throw new Error('UNAUTHORIZED');
        }
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = (await res.json()) as MeResponse;
        if (!cancelled) {
          setTeam(data.team);
        }
      } catch (e: any) {
        console.error("Failed to load /auth/me-full", e);
        if (!cancelled) {
          if (e?.message === 'UNAUTHORIZED') {
            // Token invalid → force logout
            setError("Session expired or invalid. Please log in again.");
            setTeam(null);
            setToken(null);
            if (typeof window !== "undefined") {
              window.localStorage.removeItem("CHATAPP_TOKEN");
              window.localStorage.removeItem("CHATAPP_TOKEN");
            }
          } else {
            // For other errors, keep token and just show a soft error
            setError("Unable to load your workspace. Please retry.");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchMe();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleLogin = async (email: string, password: string) => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const accessToken: string = data.accessToken;

      if (typeof window !== "undefined") {
        // Write both keys for backward compatibility
        window.localStorage.setItem("CHATAPP_TOKEN", accessToken);
        window.localStorage.setItem("CHATAPP_TOKEN", accessToken);
      }

      // Just set the token; /auth/me-full will populate team
      setToken(accessToken);
      setError(null);
    } catch (e: any) {
      console.error("Login failed", e);
      setError(e.message || "Login failed");
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("CHATAPP_TOKEN");
      window.localStorage.removeItem("CHATAPP_TOKEN");
    }
    setToken(null);
    setTeam(null);
  };

  if (!token) {
    return (
      <LoginPage
        theme={theme}
        onThemeChange={setTheme}
        onLogin={handleLogin}
        error={error}
      />
    );
  }
  // token exists and we're still fetching /auth/me
  if (loading && !team) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center text-sm text-slate-400 transition-colors duration-200 ${
          theme === "dark" ? "bg-slate-950" : "bg-slate-50"
        }`}
      >
        Loading workspace…
      </div>
    );
  }

  return (
    <AppShell
      theme={theme}
      onThemeChange={setTheme}
      team={team}
      onLogout={handleLogout}
    />
  );
}

export default App;