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
          className={`min-h-screen flex items-center justify-center px-4 transition-colors duration-200 ${
            theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
          }`}
        >
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl px-6 py-5 sm:px-8 sm:py-6 transition-colors duration-200 ${
              theme === "dark"
                ? "bg-slate-900/80 border-slate-800 shadow-black/60"
                : "bg-white border-slate-200 shadow-slate-900/10"
            }`}
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <div
                  className={`text-lg font-semibold leading-tight ${
                    theme === "dark" ? "text-slate-100" : "text-slate-900"
                  }`}
                >
                  Sign in to ChatApp
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Internal Crisp-style inbox (beta)
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors duration-150
                border-slate-600/70 text-slate-300 hover:border-slate-400 hover:text-slate-100
                dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-400
                bg-transparent"
              >
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
            </div>

            <LoginForm onLogin={handleLogin} theme={theme} />

            {error && (
              <div className="mt-3 text-xs text-red-400">
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
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3"
    >
      <label className="text-xs font-medium text-slate-400">
        Email
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors duration-150
          ${theme === "dark"
            ? "border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400"
            : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-sky-500"
          }`}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </label>

      <label className="text-xs font-medium text-slate-400">
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors duration-150
          ${theme === "dark"
            ? "border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400"
            : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-sky-500"
          }`}
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className={`mt-2 inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors duration-150
        ${submitting
          ? "bg-slate-600 text-slate-300 cursor-default"
          : "bg-emerald-400 text-slate-900 hover:bg-emerald-300 active:bg-emerald-500"
        }`}
      >
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default App;