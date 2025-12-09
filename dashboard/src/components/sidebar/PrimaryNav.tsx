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
      className="sidebar"
      style={{
        width: navExpanded ? 220 : 76,
        transition: "width 0.18s ease-out",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid var(--border-color)",
      }}
    >
      {/* Logo + collapse button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 16,
          }}
          className="sidebar-logo"
        >
          C
        </div>
        {navExpanded && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              ChatApp
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
              }}
            >
              Inbox workspace
            </div>
          </div>
        )}
        <button
          onClick={() => setNavExpanded((e) => !e)}
          type="button"
          aria-label={navExpanded ? "Collapse sidebar" : "Expand sidebar"}
          style={{
            borderRadius: 999,
            border: "none",
            width: 26,
            height: 26,
            background: "var(--bg-elevated)",
            color: "var(--text-muted)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
          }}
        >
          {navExpanded ? "◀" : "▶"}
        </button>
      </div>

      {/* MAIN NAV */}
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
          const Icon = getIconForSection(item.id);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSectionChange(item.id)}
              className={
                "sidebar-item" + (isActive ? " sidebar-item--active" : "")
              }
            >
              <span className="sidebar-item-icon">
                {/* Icon uses currentColor, so it follows CSS theme */}
                <Icon size={16} />
              </span>
              {navExpanded && (
                <span className="sidebar-item-label">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* BOTTOM: workspace + logout */}
      <div
        style={{
          borderTop: "1px solid var(--border-color)",
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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
            flexShrink: 0,
          }}
          className="sidebar-workspace-avatar"
        >
          {workspaceName.charAt(0).toUpperCase()}
        </div>
        {navExpanded && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 500,
                fontSize: 12,
                color: "var(--text-primary)",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
              }}
            >
              {workspaceName}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
              }}
            >
              Owner
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onLogout}
          title="Logout"
          style={{
            borderRadius: 999,
            border: "none",
            width: 26,
            height: 26,
            background: "transparent",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          ⏏
        </button>
      </div>
    </aside>
  );
};

export default PrimaryNav;
