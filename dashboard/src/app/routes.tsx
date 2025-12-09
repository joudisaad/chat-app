// src/app/routes.tsx
import type { Theme, Team } from "../App";
import { InboxPage } from "../pages/InboxPage/InboxPage";
import { SettingsPage } from "../pages/SettingsPage/SettingsPage";

export type SectionId =
  | "inbox"
  | "visitors"
  | "contacts"
  | "automations"
  | "campaigns"
  | "knowledge"
  | "analytics"
  | "settings";

export interface RouteComponentProps {
  theme: Theme;
  onThemeChange: (t: Theme) => void;
  team: Team | null;
}

export type RouteComponent = (props: RouteComponentProps) => JSX.Element;

export const sections: { id: SectionId; label: string }[] = [
  { id: "inbox", label: "Inbox" },
  { id: "visitors", label: "Visitors" },
  { id: "contacts", label: "Contacts" },
  { id: "automations", label: "Automations" },
  { id: "campaigns", label: "Campaigns" },
  { id: "knowledge", label: "Knowledge base" },
  { id: "analytics", label: "Analytics" },
  { id: "settings", label: "Settings" },
];

export function getSectionComponent(id: SectionId): RouteComponent {
  switch (id) {
    case "inbox":
      return InboxPage;
    case "settings":
      return SettingsPage;
    default:
      return PlaceholderPage;
  }
}

const PlaceholderPage: RouteComponent = ({ theme }) => (
  <div
    style={{
      padding: 24,
      fontSize: 13,
      color: theme === "dark" ? "#9ca3af" : "#4b5563",
    }}
  >
    This section is not implemented yet. You can plug your future features here
    (visitors, campaigns, analytics…).
  </div>
);