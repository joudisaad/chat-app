// src/pages/SettingsPage/SettingsPage.tsx
import React, { useState } from "react";
import type { RouteComponentProps } from "../../app/routes";
import { WidgetSettingsPanel } from "../../features/settings/WidgetSettingsPanel";
import { GeneralSettingsPanel } from "../../features/settings/GeneralSettingsPanel";
import { SettingsNav, type SettingsTab } from "../../features/settings/SettingsNav";

export function SettingsPage(props: RouteComponentProps) {
  const { theme, onThemeChange, team } = props;
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

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
      <SettingsNav active={activeTab} onChange={setActiveTab} />

      <section
        style={{
          borderRadius: 16,
          border: "1px solid var(--border-color)",
          background: "var(--bg-panel)",
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