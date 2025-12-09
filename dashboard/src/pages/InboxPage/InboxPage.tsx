// src/pages/InboxPage/InboxPage.tsx
import type { RouteComponentProps } from "../../app/routes";
import AgentDashboard from "../../AgentDashboard";

export function InboxPage(props: RouteComponentProps) {
  return (
    <div
      style={{
        width: "100%",           // ✅ FULL WIDTH
        height: "100%",          // ✅ FULL HEIGHT
        display: "flex",
        flexDirection: "row",    // Sidebar + main area
        overflow: "hidden",
      }}
    >
      {/* SIDEBAR (placeholder until you build it) */}
      <div
        style={{
          width: 240,            // Crisp-style sidebar width
          background: "var(--bg-panel)",
          borderRight: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: 20, color: "var(--text-primary)" }}>
          <strong>Inbox</strong>
        </div>
        {/* More sidebar items later */}
      </div>

      {/* MAIN PANEL */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "var(--bg-main)",
        }}
      >
        {/* TOP HEADER */}
        <div
          style={{
            height: 60,
            borderBottom: "1px solid var(--border-color)",
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            color: "var(--text-primary)",
            fontSize: 14,
          }}
        >
          Live Inbox
        </div>

        {/* DASHBOARD */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            padding: 0, // full-width workspace, no inner padding
          }}
        >
          <AgentDashboard team={props.team} />
        </div>
      </div>
    </div>
  );
}