// src/pages/InboxPage/InboxPage.tsx
import type { RouteComponentProps } from "../../app/routes";
import AgentDashboard from "../../AgentDashboard"; // ⬅️ default import

export function InboxPage(props: RouteComponentProps) {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Agent dashboard (conversations + chat) */}
      <AgentDashboard team={props.team} />
    </div>
  );
}