// src/app/AppShell.tsx
import { useState } from "react";
import type { Theme, Team } from "../App";
import {
  getSectionComponent,
  sections,
  type SectionId,
} from "./routes";

interface Props {
  theme: Theme;
  onThemeChange: (t: Theme) => void;
  team: Team | null;
  onLogout: () => void;
}

export function AppShell({ theme, onThemeChange, team, onLogout }: Props) {
  const [section, setSection] = useState<SectionId>("inbox");
  const [navExpanded, setNavExpanded] = useState(true);

  const CurrentPage = getSectionComponent(section);
  const workspaceName = team?.name ?? "Workspace";

  const isDark = theme === "dark";

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: isDark ? "#020617" : "#f3f4f6",
        color: isDark ? "#e5e7eb" : "#111827",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, system-ui, -system-ui, 'SF Pro Text', sans-serif",
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          width: navExpanded ? 220 : 72,
          transition: "width 0.18s ease-out",
          borderRight: isDark ? "1px solid #111827" : "1px solid #e5e7eb",
          background: isDark ? "#020617" : "#ffffff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Logo + collapse button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderBottom: isDark ? "1px solid #111827" : "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              background:
                "linear-gradient(135deg, #22c55e, #22d3ee, #6366f1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 16,
              color: "#020617",
            }}
          >
            C
          </div>
          {navExpanded && (
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                ChatApp
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                }}
              >
                Inbox prototype
              </div>
            </div>
          )}
          <button
            onClick={() => setNavExpanded((e) => !e)}
            style={{
              borderRadius: 999,
              border: "none",
              width: 26,
              height: 26,
              background: isDark ? "#020617" : "#f9fafb",
              color: "#9ca3af",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            {navExpanded ? "◀" : "▶"}
          </button>
        </div>

        {/* PRIMARY NAV */}
        <nav
          style={{
            flex: 1,
            padding: "10px 8px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            fontSize: 13,
          }}
        >
          {sections.map((item) => {
            const isActive = item.id === section;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                style={{
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 8px",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  background: isActive
                    ? "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(22,163,74,0.16))"
                    : "transparent",
                  color: isActive ? "#e5e7eb" : "#9ca3af",
                }}
              >
                {/* tiny bubble icon */}
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    border: isActive
                      ? "none"
                      : isDark
                      ? "1px solid #1f2937"
                      : "1px solid #e5e7eb",
                    background: isActive
                      ? "linear-gradient(135deg, #22c55e, #60a5fa)"
                      : isDark
                      ? "#020617"
                      : "#ffffff",
                  }}
                />
                {navExpanded && (
                  <span
                    style={{
                      flex: 1,
                      textAlign: "left",
                      fontWeight: isActive ? 500 : 400,
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* BOTTOM USER */}
        <div
          style={{
            borderTop: isDark ? "1px solid #111827" : "1px solid #e5e7eb",
            padding: "8px 10px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              background:
                "radial-gradient(circle at 30% 0, #22c55e, #16a34a 60%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              color: "#022c22",
            }}
          >
            {workspaceName.charAt(0).toUpperCase()}
          </div>
          {navExpanded && (
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: 500,
                  fontSize: 12,
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
                Owner
              </div>
            </div>
          )}
          <button
            onClick={onLogout}
            title="Logout"
            style={{
              borderRadius: 999,
              border: "none",
              width: 26,
              height: 26,
              background: "transparent",
              color: "#9ca3af",
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            ⏏
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {/* TOP BAR */}
        <header
          style={{
            height: 52,
            borderBottom: isDark ? "1px solid #111827" : "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            background: isDark ? "#020617" : "#ffffff",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              {section === "inbox"
                ? "Inbox"
                : section === "settings"
                ? "Settings"
                : "ChatApp"}
            </div>
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 999,
                border: "1px solid rgba(34,197,94,0.4)",
                color: "#4ade80",
              }}
            >
              Beta
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 12,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "#9ca3af",
              }}
            >
              Live conversations powered by your own API
            </span>
            <button
              onClick={() => onThemeChange(isDark ? "light" : "dark")}
              style={{
                borderRadius: 999,
                border: isDark ? "1px solid #374151" : "1px solid #d1d5db",
                background: isDark ? "#020617" : "#ffffff",
                color: "#9ca3af",
                padding: "4px 10px",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              {isDark ? "Light mode" : "Dark mode"}
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main
          style={{
            flex: 1,
            minHeight: 0,
            padding: 12,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <CurrentPage theme={theme} onThemeChange={onThemeChange} team={team} />
        </main>
      </div>
    </div>
  );
}