import React from "react";

export type SettingsTab = "widget" | "general" | "team" | "billing" | "profile";

interface SettingsNavProps {
  active: SettingsTab;
  onChange: (tab: SettingsTab) => void;
}

const SETTINGS_ITEMS = [
  { id: "widget", label: "Widget appearance", description: "Launcher style & install code" },
  { id: "general", label: "General", description: "Workspace name & language" },
  { id: "team", label: "Team & members", description: "Invite and manage agents" },
  { id: "billing", label: "Billing", description: "Plan & invoices" },
  { id: "profile", label: "Your profile", description: "Personal info & preferences" },
];

export const SettingsNav: React.FC<SettingsNavProps> = ({ active, onChange }) => {
  return (
    <nav className="flex flex-col gap-2 py-2">
      {SETTINGS_ITEMS.map((item) => {
        const isActive = item.id === active;

        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={[
              "text-left w-full rounded-xl px-3 py-2 transition-all",
              "border bg-white/90 dark:bg-slate-900/80 dark:border-slate-800/70",
              "hover:border-emerald-500/70 hover:bg-emerald-50/70 dark:hover:bg-slate-800/60",
              isActive
                ? "border-emerald-500/70 bg-emerald-50 dark:bg-emerald-900/20 shadow-sm"
                : "border-slate-200/70",
              "cursor-pointer"
            ].join(" ")}
          >
            <div className="text-[13px] font-medium text-slate-900 dark:text-slate-100 mb-[2px]">
              {item.label}
            </div>

            {item.description && (
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
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