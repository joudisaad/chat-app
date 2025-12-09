// dashboard/src/App.tsx
import { useState } from "react";
import { AgentDashboard } from "./AgentDashboard";

const API_URL = "http://localhost:3000";

function App() {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("chat_access_token");
  });
  const [email, setEmail] = useState("saad@example.com");
  const [password, setPassword] = useState("test1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await res.json();
      const t = data.accessToken as string;
      setToken(t);
      localStorage.setItem("chat_access_token", t);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("chat_access_token");
  };

  if (!token) {
    // Simple login screen
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#050816",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <div
          style={{
            width: 360,
            padding: 24,
            borderRadius: 16,
            background: "#0b1120",
            border: "1px solid #1f2937",
            color: "#e5e7eb",
            boxShadow: "0 24px 60px rgba(0,0,0,0.75)",
          }}
        >
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Agent Login
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              marginBottom: 16,
            }}
          >
            Sign in to access your chat inbox.
          </p>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={{ fontSize: 12 }}>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  marginTop: 4,
                  width: "100%",
                  background: "#020617",
                  borderRadius: 8,
                  border: "1px solid #1f2937",
                  padding: "8px 10px",
                  color: "white",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </label>

            <label style={{ fontSize: 12 }}>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  marginTop: 4,
                  width: "100%",
                  background: "#020617",
                  borderRadius: 8,
                  border: "1px solid #1f2937",
                  padding: "8px 10px",
                  color: "white",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </label>

            {error && (
              <div
                style={{
                  fontSize: 12,
                  color: "#fca5a5",
                  marginTop: 4,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 8,
                borderRadius: 999,
                border: "none",
                background: "#22c55e",
                color: "#020617",
                fontSize: 14,
                fontWeight: 600,
                padding: "8px 12px",
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Logged in: show agent dashboard
  return <AgentDashboard token={token} onLogout={handleLogout} />;
}

export default App;