// src/components/sidebar/PrimaryNav.tsx
import React, { useState } from "react";
import type { Theme, Team } from "../../App";
import { sections, type SectionId } from "../../app/routes";
import {
  Inbox,
  Users,
  Bot,
  MessageCircle,
  BookOpen,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
} from "lucide-react";

interface PrimaryNavProps {
  theme: Theme;
  section: SectionId;
  onSectionChange: (id: SectionId) => void;
  team: Team | null;
  onLogout: () => void;
}

export const PrimaryNav: React.FC<PrimaryNavProps> = ({
  theme,
  section,
  onSectionChange,
  team,
  onLogout,
}) => {
  const [navExpanded, setNavExpanded] = useState(true);
  const workspaceName = team?.name ?? "Workspace";
  const isDark = theme === "dark";

  // Map section id to icon
  const getIconForSection = (id: SectionId) => {
    switch (id) {
      case "inbox":
        return Inbox;
      case "visitors":
        return Users;
      case "contacts":
        return Users;
      case "automations":
        return Bot;
      case "campaigns":
        return MessageCircle;
      case "knowledge":
        return BookOpen;
      case "analytics":
        return BarChart3;
      case "settings":
        return SettingsIcon;
      default:
        return MessageCircle;
    }
  };

  return (
    <aside
      className={`flex flex-col border-r transition-[width] duration-200 ${
        isDark
          ? "border-slate-800 bg-slate-950/95 text-slate-100"
          : "border-slate-200 bg-white/95 text-slate-900"
      }`}
      style={{ width: navExpanded ? 220 : 76 }}
    >
      {/* Logo + collapse button */}
      <div
        className={`flex items-center gap-2 px-3 py-2 border-b ${
          isDark ? "border-slate-800" : "border-slate-200"
        }`}
      >
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-[16px] font-semibold ${
            isDark ? "bg-slate-900 text-emerald-400" : "bg-slate-100 text-emerald-500"
          }`}
        >
          C
        </div>
        {navExpanded && (
          <div className="min-w-0 flex-1">
            <div
              className={`truncate text-[13px] font-semibold ${
                isDark ? "text-slate-100" : "text-slate-900"
              }`}
            >
              ChatApp
            </div>
            <div className="truncate text-[11px] text-slate-400">
              Inbox workspace
            </div>
          </div>
        )}
        <button
          onClick={() => setNavExpanded((e) => !e)}
          type="button"
          aria-label={navExpanded ? "Collapse sidebar" : "Expand sidebar"}
          className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] transition-colors ${
            isDark
              ? "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
          }`}
        >
          {navExpanded ? "◀" : "▶"}
        </button>
      </div>

      {/* MAIN NAV */}
      <nav className="flex flex-1 flex-col gap-1 px-2 py-2 text-[13px]">
        {sections.map((item) => {
          const isActive = item.id === section;
          const Icon = getIconForSection(item.id);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSectionChange(item.id)}
              className={[
                "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-colors",
                isActive
                  ? isDark
                    ? "bg-slate-800 text-slate-50"
                    : "bg-slate-100 text-slate-900"
                  : isDark
                  ? "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
              ].join(" ")}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] ${
                  isActive
                    ? isDark
                      ? "bg-slate-700 text-slate-50"
                      : "bg-slate-200 text-slate-900"
                    : isDark
                    ? "bg-slate-900 text-slate-400"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <Icon size={16} />
              </span>
              {navExpanded && (
                <span className="truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* BOTTOM: workspace + logout */}
      <div
        className={`flex items-center gap-2 px-3 py-2 border-t text-[12px] ${
          isDark ? "border-slate-800" : "border-slate-200"
        }`}
      >
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold ${
            isDark ? "bg-slate-900 text-emerald-400" : "bg-slate-100 text-emerald-500"
          }`}
        >
          {workspaceName.charAt(0).toUpperCase()}
        </div>
        {navExpanded && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-medium">
              {workspaceName}
            </div>
            <div className="text-[11px] text-slate-400">Owner</div>
          </div>
        )}
        <button
          type="button"
          onClick={onLogout}
          title="Logout"
          className={`flex h-8 w-8 items-center justify-center rounded-full text-[14px] transition-colors ${
            isDark
              ? "text-slate-400 hover:bg-slate-900 hover:text-red-400"
              : "text-slate-500 hover:bg-slate-100 hover:text-red-500"
          }`}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};

export default PrimaryNav;
