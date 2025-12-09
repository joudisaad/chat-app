// src/app/AppShell.tsx
import { useState } from "react";
import type { Theme, Team } from "../App";
import {
  getSectionComponent,
  sections,
  type SectionId,
} from "./routes";
import { PrimaryNav } from "../components/sidebar/PrimaryNav";

interface Props {
  theme: Theme;
  onThemeChange: (t: Theme) => void;
  team: Team | null;
  onLogout: () => void;
}

export function AppShell({ theme, onThemeChange, team, onLogout }: Props) {
  const [section, setSection] = useState<SectionId>("inbox");

  const CurrentPage = getSectionComponent(section);
  const workspaceName = team?.name ?? "Workspace";

  const isDark = theme === "dark";

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        background: isDark ? "#020617" : "#f3f4f6",
        color: isDark ? "#e5e7eb" : "#111827",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, system-ui, -system-ui, 'SF Pro Text', sans-serif",
      }}
    >
      <PrimaryNav
        theme={theme}
        section={section}
        onSectionChange={setSection}
        team={team}
        onLogout={onLogout}
      />

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
            padding: 0,
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