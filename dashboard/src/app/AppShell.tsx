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
      className={`min-h-screen w-full flex transition-colors duration-200 ${
        isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      <PrimaryNav
        theme={theme}
        section={section}
        onSectionChange={setSection}
        team={team}
        onLogout={onLogout}
      />

      {/* MAIN */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* TOP BAR */}
        <header
          className={`h-13 flex items-center justify-between px-4 border-b transition-colors duration-200 ${
            isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="text-[15px] font-semibold">
              {section === "inbox"
                ? "Inbox"
                : section === "settings"
                ? "Settings"
                : "ChatApp"}
            </div>
            <span
              className="inline-flex items-center rounded-full border px-2.5 py-[2px] text-[11px]"
              style={{
                borderColor: "rgba(34,197,94,0.4)",
                color: "#4ade80",
              }}
            >
              Beta
            </span>
          </div>

          <div className="flex items-center gap-2 text-[12px]">
            <span className="hidden sm:inline text-[11px] text-slate-400">
              Live conversations powered by your own API
            </span>
            <button
              type="button"
              onClick={() => onThemeChange(isDark ? "light" : "dark")}
              className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium transition-colors duration-150
                ${
                  isDark
                    ? "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:text-slate-100"
                    : "border-slate-300 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-700"
                }`}
            >
              {isDark ? "Light mode" : "Dark mode"}
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex flex-1 min-h-0 flex-col">
          <CurrentPage theme={theme} onThemeChange={onThemeChange} team={team} />
        </main>
      </div>
    </div>
  );
}