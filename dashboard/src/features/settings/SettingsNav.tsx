// src/features/settings/SettingsNav.tsx
import React from "react";

export type SettingsTab = "general" | "widget";   // ⬅️ required export

interface SettingsNavProps {
  activeTab: SettingsTab;
  onChange: (tab: SettingsTab) => void;
  isDark: boolean;
}

export const SettingsNav: React.FC<SettingsNavProps> = ({
  activeTab,
  onChange,
  isDark,
}) => {
  return (
    <aside
      style={{
        borderRadius: 16,
        border: isDark ? "1px solid #111827" : "1px solid #e5e7eb",
        background: isDark ? "#020617" : "#ffffff",
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        fontSize: 13,
      }}
    >
      {/* Buttons… */}
    </aside>
  );
};