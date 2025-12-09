import React from "react";

export type SettingsTab = "widget" | "general" | "team" | "billing" | "profile";

interface SettingsNavProps {
  active: SettingsTab;
  onChange: (tab: SettingsTab) => void;
}

const SETTINGS_ITEMS: { id: SettingsTab; label: string; description?: string }[] = [
  { id: "widget", label: "Widget appearance", description: "Launcher style & install code" },
  { id: "general", label: "General", description: "Workspace name & language" },
  { id: "team", label: "Team & members", description: "Invite and manage agents" },
  { id: "billing", label: "Billing", description: "Plan & invoices" },
  { id: "profile", label: "Your profile", description: "Personal info & preferences" },
];

export const SettingsNav: React.FC<SettingsNavProps> = ({ active, onChange }) => {
  return (
    <nav
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "8px 0",
      }}
    >
      {SETTINGS_ITEMS.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            style={{
              textAlign: "left",
              border: "none",
              borderRadius: 10,
              padding: "8px 10px",
              width: "100%",
              cursor: "pointer",
              background: isActive
                ? "linear-gradient(135deg, rgba(59,130,246,0.16), rgba(34,197,94,0.18))"
                : "transparent",
              color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                marginBottom: item.description ? 2 : 0,
              }}
            >
              {item.label}
            </div>
            {item.description && (
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.8,
                }}
              >
                {item.description}
              </div>
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default SettingsNav;