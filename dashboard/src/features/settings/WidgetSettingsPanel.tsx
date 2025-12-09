// src/features/settings/WidgetSettingsPanel.tsx
import React, { useState } from "react";
import type { Theme, Team } from "../../App";

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
  const workspaceName = team?.name ?? "Your workspace";
  const isDark = theme === "dark";

  const [widgetPosition, setWidgetPosition] =
    useState<"bottom-right" | "bottom-left">("bottom-right");
  const [launcherColor, setLauncherColor] = useState("#22c55e");
  const [textColor, setTextColor] = useState("#022c22");

  const publicKey = team?.publicKey ?? "site_xxxxxx";

  const scriptSnippet = `<script>
  window.CHATAPP_KEY = "${publicKey}";
  window.CHATAPP_POSITION = "${widgetPosition}";
  // Colors & label are configured from your ChatApp dashboard
  (function() {
    var s = document.createElement("script");
    s.src = "https://cdn.chatapp.local/widget.js";
    s.async = true;
    document.head.appendChild(s);
  })();
</script>`;

  return (
    <>
      {/* Header */}
      <h2
        style={{
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        Widget appearance &amp; install
      </h2>
      <p
        style={{
          fontSize: 13,
          color: "#9ca3af",
          marginBottom: 16,
        }}
      >
        Customize how the chat widget looks and how you embed it on your site.
      </p>

      {/* Brand & theme + preview */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.4fr)",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        {/* Brand & theme */}
        <div
          style={{
            borderRadius: 16,
            border: "1px solid #111827",
            background:
              "radial-gradient(circle at top left, rgba(34,197,94,0.15), transparent 50%)",
            padding: 16,
          }}
        >
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Brand &amp; theme
          </h3>
          <p
            style={{
              fontSize: 12,
              color: "#9ca3af",
              marginBottom: 12,
            }}
          >
            Choose the global style for your messenger. Detailed widget controls
            will come later.
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                background:
                  "linear-gradient(135deg, #22c55e, #22d3ee, #6366f1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 18,
                color: "#020617",
              }}
            >
              {workspaceName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {workspaceName}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                }}
              >
                Multi-channel inbox • SaaS prototype
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 4,
            }}
          >
            <button
              onClick={() => onThemeChange("light")}
              style={{
                borderRadius: 999,
                border: theme === "light" ? "none" : "1px solid #d1d5db",
                padding: "6px 10px",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                background: theme === "light" ? "#22c55e" : "#f9fafb",
                color: theme === "light" ? "#020617" : "#111827",
              }}
            >
              Light mode
            </button>
            <button
              onClick={() => onThemeChange("dark")}
              style={{
                borderRadius: 999,
                border: theme === "dark" ? "none" : "1px solid #374151",
                padding: "6px 10px",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                background: theme === "dark" ? "#111827" : "transparent",
                color: theme === "dark" ? "#e5e7eb" : "#4b5563",
              }}
            >
              Dark mode
            </button>
          </div>

          {/* Color pickers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 10,
              marginTop: 14,
              fontSize: 12,
            }}
          >
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <span
                style={{
                  color: "#9ca3af",
                  fontSize: 12,
                }}
              >
                Launcher color
              </span>
              <input
                type="color"
                value={launcherColor}
                onChange={(e) => setLauncherColor(e.target.value)}
                style={{
                  width: 44,
                  height: 26,
                  borderRadius: 999,
                  border: "1px solid #1f2937",
                  padding: 0,
                  background: "transparent",
                  cursor: "pointer",
                }}
              />
            </label>
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <span
                style={{
                  color: "#9ca3af",
                  fontSize: 12,
                }}
              >
                Text color
              </span>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                style={{
                  width: 44,
                  height: 26,
                  borderRadius: 999,
                  border: "1px solid #1f2937",
                  padding: 0,
                  background: "transparent",
                  cursor: "pointer",
                }}
              />
            </label>
          </div>
        </div>

        {/* Live widget preview */}
        <div
          style={{
            borderRadius: 16,
            border: "1px solid #111827",
            background:
              "radial-gradient(circle at bottom right, rgba(56,189,248,0.18), transparent 55%)",
            padding: 14,
          }}
        >
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Live widget preview
          </h3>
          <p
            style={{
              fontSize: 11,
              color: "#9ca3af",
              marginBottom: 10,
            }}
          >
            A minimal preview of how the launcher will appear on your site.
          </p>

          <div
            style={{
              position: "relative",
              borderRadius: 12,
              border: "1px solid #1f2937",
              background:
                "linear-gradient(145deg, #020617, #020617, #030712)",
              padding: 10,
              height: 150,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background:
                  "radial-gradient(circle at top, rgba(148,163,184,0.16), transparent 55%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 14,
                right: widgetPosition === "bottom-right" ? 14 : "auto",
                left: widgetPosition === "bottom-left" ? 14 : "auto",
              }}
            >
              <div
                style={{
                  borderRadius: 999,
                  background: launcherColor,
                  padding: "8px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 12px 30px rgba(22,163,74,0.4)",
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 999,
                    background: launcherColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    color: textColor,
                  }}
                >
                  💬
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: textColor,
                  }}
                >
                  Chat with us
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Position + install snippet */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1.8fr)",
          gap: 16,
          marginTop: 18,
        }}
      >
        {/* Position */}
        <div
          style={{
            borderRadius: 14,
            border: "1px solid #111827",
            padding: 14,
            background: isDark ? "#020617" : "#ffffff",
          }}
        >
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Widget position
          </h3>
          <p
            style={{
              fontSize: 12,
              color: "#9ca3af",
              marginBottom: 10,
            }}
          >
            Choose where the chat launcher appears on your site.
          </p>
          <div
            style={{
              display: "flex",
              gap: 8,
            }}
          >
            <button
              onClick={() => setWidgetPosition("bottom-right")}
              style={{
                borderRadius: 999,
                border:
                  widgetPosition === "bottom-right"
                    ? "none"
                    : "1px solid #d1d5db",
                padding: "6px 10px",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                background:
                  widgetPosition === "bottom-right" ? "#22c55e" : "#f9fafb",
                color:
                  widgetPosition === "bottom-right" ? "#020617" : "#111827",
              }}
            >
              Bottom right (default)
            </button>
            <button
              onClick={() => setWidgetPosition("bottom-left")}
              style={{
                borderRadius: 999,
                border:
                  widgetPosition === "bottom-left"
                    ? "none"
                    : "1px solid #d1d5db",
                padding: "6px 10px",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                background:
                  widgetPosition === "bottom-left" ? "#22c55e" : "#f9fafb",
                color:
                  widgetPosition === "bottom-left" ? "#020617" : "#111827",
              }}
            >
              Bottom left
            </button>
          </div>
        </div>

        {/* Install widget */}
        <div
          style={{
            borderRadius: 14,
            border: "1px solid #111827",
            padding: 14,
            background: isDark ? "#020617" : "#ffffff",
          }}
        >
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Install widget
          </h3>
          <p
            style={{
              fontSize: 12,
              color: "#9ca3af",
              marginBottom: 10,
            }}
          >
            Paste this code before the closing{" "}
            <code style={{ fontFamily: "monospace" }}>&lt;/body&gt;</code> tag
            of your website. It is already bound to your public site key.
          </p>
          <pre
            style={{
              fontFamily:
                "SFMono-Regular, ui-monospace, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              fontSize: 11,
              borderRadius: 10,
              border: "1px solid #1f2937",
              padding: 10,
              background: "#020617",
              color: "#e5e7eb",
              overflowX: "auto",
              maxHeight: 220,
            }}
          >
            {scriptSnippet}
          </pre>
        </div>
      </div>
    </>
  );
};