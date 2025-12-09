// src/App.tsx
import { useEffect, useState } from "react";
import { AppShell } from "./app/AppShell";
import "./App.css";

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
  return window.localStorage.getItem("CHATAPP_TOKEN");
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

  // load /auth/me when token changes
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
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = (await res.json()) as MeResponse;
        if (!cancelled) {
          setTeam(data.team);
        }
      } catch (e: any) {
        console.error("Failed to load /auth/me", e);
        if (!cancelled) {
          // 🔥 if token is invalid, clear it and show login
          setError("Session expired or invalid. Please log in again.");
          setTeam(null);
          setToken(null);
          if (typeof window !== "undefined") {
            window.localStorage.removeItem("CHATAPP_TOKEN");
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
      const t: Team = data.team;

      if (typeof window !== "undefined") {
        window.localStorage.setItem("CHATAPP_TOKEN", accessToken);
      }
      setToken(accessToken);
      setTeam(t);
    } catch (e: any) {
      console.error("Login failed", e);
      setError(e.message || "Login failed");
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("CHATAPP_TOKEN");
    }
    setToken(null);
    setTeam(null);
  };

  // if no token → show login
  if (!token) {
    return (
      <div className={`app-root theme-${theme}`}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: theme === "dark" ? "#020617" : "#f3f4f6",
            padding: 24,
          }}
        >
          <div
            style={{
              width: 360,
              borderRadius: 16,
              padding: 24,
              background: theme === "dark" ? "#020617" : "#ffffff",
              border: theme === "dark" ? "1px solid #111827" : "1px solid #e5e7eb",
              boxShadow:
                theme === "dark"
                  ? "0 22px 60px rgba(15,23,42,0.85)"
                  : "0 18px 40px rgba(15,23,42,0.12)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 16,
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: theme === "dark" ? "#e5e7eb" : "#111827",
                  }}
                >
                  Sign in to ChatApp
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#9ca3af",
                    marginTop: 2,
                  }}
                >
                  Internal Crisp-style inbox (beta)
                </div>
              </div>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                style={{
                  borderRadius: 999,
                  border: "1px solid #4b5563",
                  background: "transparent",
                  color: "#9ca3af",
                  padding: "4px 10px",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                {theme === "dark" ? "Light" : "Dark"}
              </button>
            </div>

            <LoginForm onLogin={handleLogin} theme={theme} />

            {error && (
              <div
                style={{
                  marginTop: 12,
                  fontSize: 12,
                  color: "#f97373",
                }}
              >
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // token exists and we're still fetching /auth/me
  if (loading && !team) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: theme === "dark" ? "#020617" : "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#9ca3af",
          fontSize: 13,
        }}
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

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
  theme: Theme;
}

function LoginForm({ onLogin, theme }: LoginFormProps) {
  const [email, setEmail] = useState("saad@example.com");
  const [password, setPassword] = useState("test1234");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await onLogin(email, password);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label style={{ fontSize: 12, color: "#9ca3af" }}>
        Email
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            marginTop: 4,
            width: "100%",
            borderRadius: 8,
            border: theme === "dark" ? "1px solid #1f2937" : "1px solid #d1d5db",
            padding: "8px 10px",
            fontSize: 13,
            background: theme === "dark" ? "#020617" : "#ffffff",
            color: theme === "dark" ? "#e5e7eb" : "#111827",
          }}
        />
      </label>
      <label style={{ fontSize: 12, color: "#9ca3af" }}>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            marginTop: 4,
            width: "100%",
            borderRadius: 8,
            border: theme === "dark" ? "1px solid #1f2937" : "1px solid #d1d5db",
            padding: "8px 10px",
            fontSize: 13,
            background: theme === "dark" ? "#020617" : "#ffffff",
            color: theme === "dark" ? "#e5e7eb" : "#111827",
          }}
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        style={{
          marginTop: 6,
          borderRadius: 999,
          border: "none",
          padding: "8px 12px",
          fontSize: 13,
          fontWeight: 500,
          cursor: submitting ? "default" : "pointer",
          background: submitting ? "#4b5563" : "#22c55e",
          color: "#022c22",
        }}
      >
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default App;