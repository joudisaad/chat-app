import React, { useEffect, useState } from "react";
import type { Theme, Team } from "../../App";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const WIDGET_URL = import.meta.env.VITE_WIDGET_URL ?? "http://localhost:4173";

export interface WidgetSettingsResponse {
  position: "bottom-right" | "bottom-left";
  launcherColor: string;
  textColor: string;
}

interface WidgetSettingsPanelProps {
  theme: Theme;
  onThemeChange: (t: Theme) => void;
  team: Team | null;
}

export const WidgetSettingsPanel: React.FC<WidgetSettingsPanelProps> = ({
  theme,
  onThemeChange,
  team,
}) => {
  const [position, setPosition] = useState<"bottom-right" | "bottom-left">("bottom-right");
  const [launcherColor, setLauncherColor] = useState<string>("#22c55e");
  const [textColor, setTextColor] = useState<string>("#ffffff");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<boolean>(false);

  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("CHATAPP_TOKEN")
      : null;

  // Load current settings from API
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadSettings() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/widget-settings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as WidgetSettingsResponse;
        if (!cancelled && data) {
          if (data.position) setPosition(data.position);
          if (data.launcherColor) setLauncherColor(data.launcherColor);
          if (data.textColor) setTextColor(data.textColor);
        }
      } catch (e: any) {
        console.error("Failed to load widget settings", e);
        if (!cancelled) setError("Failed to load widget settings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSettings();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`${API_URL}/widget-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ position, launcherColor, textColor }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || `HTTP ${res.status}`);
      }
      setSaved(true);
    } catch (e: any) {
      console.error("Failed to save widget settings", e);
      setError(e.message || "Failed to save widget settings");
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const installSnippet = team?.publicKey
    ? `<script>
  window.CHATAPP_KEY = "${team.publicKey}";
  (function(){
    var s = document.createElement('script');
    s.src = '${WIDGET_URL}/widget.js';
    s.async = true;
    document.head.appendChild(s);
  })();
</script>`
    : "You need a team public key to generate the install snippet.";

  return (
    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
      <header style={{ marginBottom: 16 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            margin: 0,
            marginBottom: 4,
            color: "var(--text-primary)",
          }}
        >
          Widget appearance & install
        </h2>
        <p style={{ margin: 0 }}>Control how the chat launcher looks on your website.</p>
      </header>

      {loading ? (
        <div style={{ fontSize: 13 }}>Loading widget settings…</div>
      ) : (
        <>
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
              gap: 16,
              alignItems: "flex-start",
              marginBottom: 20,
            }}
          >
            {/* Left: form fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Position */}
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 4,
                    color: "var(--text-primary)",
                  }}
                >
                  Launcher position
                </div>
                <div style={{ fontSize: 12, marginBottom: 6 }}>
                  Choose where the chat bubble appears on your pages.
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { id: "bottom-right", label: "Bottom right" },
                    { id: "bottom-left", label: "Bottom left" },
                  ].map((opt) => {
                    const selected = position === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPosition(opt.id as any)}
                        style={{
                          flex: 1,
                          borderRadius: 10,
                          padding: "6px 8px",
                          border: selected
                            ? "1px solid #22c55e"
                            : "1px solid var(--border-color)",
                          background: selected
                            ? "rgba(34,197,94,0.12)"
                            : "transparent",
                          color: selected
                            ? "var(--text-primary)"
                            : "var(--text-secondary)",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Colors */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 4,
                      color: "var(--text-primary)",
                    }}
                  >
                    Launcher color
                  </div>
                  <input
                    type="color"
                    value={launcherColor}
                    onChange={(e) => setLauncherColor(e.target.value)}
                    style={{
                      width: "100%",
                      height: 32,
                      borderRadius: 8,
                      border: "1px solid var(--border-color)",
                      padding: 0,
                      background: "transparent",
                    }}
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 4,
                      color: "var(--text-primary)",
                    }}
                  >
                    Text & icon color
                  </div>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    style={{
                      width: "100%",
                      height: 32,
                      borderRadius: 8,
                      border: "1px solid var(--border-color)",
                      padding: 0,
                      background: "transparent",
                    }}
                  />
                </div>
              </div>

              {/* Theme toggle */}
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 4,
                    color: "var(--text-primary)",
                  }}
                >
                  Default dashboard theme
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => onThemeChange("light")}
                    style={{
                      flex: 1,
                      borderRadius: 999,
                      padding: "6px 8px",
                      border:
                        theme === "light"
                          ? "1px solid #22c55e"
                          : "1px solid var(--border-color)",
                      background:
                        theme === "light"
                          ? "rgba(34,197,94,0.12)"
                          : "transparent",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() => onThemeChange("dark")}
                    style={{
                      flex: 1,
                      borderRadius: 999,
                      padding: "6px 8px",
                      border:
                        theme === "dark"
                          ? "1px solid #22c55e"
                          : "1px solid var(--border-color)",
                      background:
                        theme === "dark"
                          ? "rgba(34,197,94,0.12)"
                          : "transparent",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Dark
                  </button>
                </div>
              </div>

              {/* Save button + status */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  style={{
                    borderRadius: 999,
                    border: "none",
                    padding: "8px 14px",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: saving ? "default" : "pointer",
                    background: saving ? "#4b5563" : "#22c55e",
                    color: "#022c22",
                  }}
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
                {saved && (
                  <span
                    style={{
                      fontSize: 12,
                      color: "#22c55e",
                    }}
                  >
                    Saved.
                  </span>
                )}
                {error && (
                  <span
                    style={{
                      fontSize: 12,
                      color: "#f97373",
                    }}
                  >
                    {error}
                  </span>
                )}
              </div>
            </div>

            {/* Right: live preview */}
            <div
              style={{
                borderRadius: 14,
                border: "1px solid var(--border-color)",
                padding: 14,
                background: "var(--bg-subpanel)",
                minHeight: 120,
                display: "flex",
                alignItems: "flex-end",
                justifyContent:
                  position === "bottom-right" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  borderRadius: 999,
                  padding: "6px 10px",
                  background: launcherColor,
                  color: textColor,
                  fontSize: 12,
                  boxShadow: "0 12px 30px rgba(15,23,42,0.45)",
                  cursor: "default",
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.7)",
                  }}
                />
                <span>Chat with us</span>
              </div>
            </div>
          </section>

          {/* Install code */}
          <section>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 2,
                    color: "var(--text-primary)",
                  }}
                >
                  Install on your website
                </div>
                <div style={{ fontSize: 12 }}>
                  Paste this before the closing {"</body>"} tag on your site.
                </div>
              </div>
            </div>
            <textarea
              readOnly
              value={installSnippet}
              style={{
                width: "100%",
                minHeight: 140,
                borderRadius: 10,
                border: "1px solid var(--border-color)",
                background: "var(--bg-subpanel)",
                color: "var(--text-primary)",
                fontFamily:
                  "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                fontSize: 12,
                padding: 10,
                resize: "vertical",
              }}
            />
          </section>
        </>
      )}
    </div>
  );
};

export default WidgetSettingsPanel;