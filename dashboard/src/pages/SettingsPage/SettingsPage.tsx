// src/pages/SettingsPage/SettingsPage.tsx
import React, { useState } from "react";
import type { RouteComponentProps } from "../../app/routes";
import { WidgetSettingsPanel } from "../../features/settings/WidgetSettingsPanel";
import { GeneralSettingsPanel } from "../../features/settings/GeneralSettingsPanel";
import { SettingsNav } from "../../features/settings/SettingsNav";
import type { SettingsTab } from "../../features/settings/SettingsNav";

export function SettingsPage(props: RouteComponentProps) {
  const { theme, onThemeChange, team } = props;
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  const isDark = theme === "dark";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px minmax(0, 1fr)",
        gap: 16,
        height: "100%",
        minHeight: 0,
      }}
    >
      <SettingsNav
        activeTab={activeTab}
        onChange={setActiveTab}
        isDark={isDark}
      />

      <section
        style={{
          borderRadius: 16,
          border: isDark ? "1px solid #111827" : "1px solid #e5e7eb",
          background: isDark ? "#020617" : "#ffffff",
          padding: 18,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {activeTab === "widget" ? (
          <WidgetSettingsPanel
            theme={theme}
            onThemeChange={onThemeChange}
            team={team}
          />
        ) : (
          <GeneralSettingsPanel theme={theme} />
        )}
      </section>
    </div>
  );
}