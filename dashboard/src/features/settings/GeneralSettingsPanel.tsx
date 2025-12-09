// src/features/settings/GeneralSettingsPanel.tsx
import React from "react";
import type { Theme } from "../../App";

interface GeneralSettingsPanelProps {
  theme: Theme;
}

export const GeneralSettingsPanel: React.FC<GeneralSettingsPanelProps> = ({
  theme,
}) => {
  const isDark = theme === "dark";

  return (
    <>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        Workspace settings
      </h2>
      <p
        style={{
          fontSize: 13,
          color: "#9ca3af",
          marginBottom: 16,
        }}
      >
        Configure high-level options for how your workspace behaves.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
          marginTop: 18,
          fontSize: 12,
        }}
      >
        <div
          style={{
            borderRadius: 14,
            border: "1px solid #111827",
            padding: 12,
            background: isDark ? "#020617" : "#ffffff",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Agents &amp; availability
          </div>
          <div
            style={{
              color: "#9ca3af",
              fontSize: 11,
            }}
          >
            Add agents, define roles and control who can reply to customers.
          </div>
        </div>
        <div
          style={{
            borderRadius: 14,
            border: "1px solid #111827",
            padding: 12,
            background: isDark ? "#020617" : "#ffffff",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Automation scenarios
          </div>
          <div
            style={{
              color: "#9ca3af",
              fontSize: 11,
            }}
          >
            Draft flows for welcome messages, offline replies and lead capture.
          </div>
        </div>
        <div
          style={{
            borderRadius: 14,
            border: "1px solid #111827",
            padding: 12,
            background: isDark ? "#020617" : "#ffffff",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Data &amp; privacy
          </div>
          <div
            style={{
              color: "#9ca3af",
              fontSize: 11,
            }}
          >
            Later you can plug GDPR tools, data retention and export options
            here.
          </div>
        </div>
      </div>
    </>
  );
};