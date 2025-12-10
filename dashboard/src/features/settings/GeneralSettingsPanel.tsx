// src/features/settings/GeneralSettingsPanel.tsx
import React from "react";
import type { Theme } from "../../App";

interface GeneralSettingsPanelProps {
  theme: Theme;
}

export const GeneralSettingsPanel: React.FC<GeneralSettingsPanelProps> = ({
  theme,
}) => {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-[18px] font-semibold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold border border-emerald-500/40">
            WS
          </span>
          <span>Workspace settings</span>
        </h2>
        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
          Configure high-level options for how your workspace behaves.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3 text-[12px]">
        {/* Agents & availability */}
        <button
          type="button"
          className="group flex flex-col items-start gap-1 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-left shadow-sm shadow-slate-900/5 hover:border-emerald-500/70 hover:shadow-md hover:shadow-emerald-500/10 transition-all dark:border-slate-800/80 dark:bg-slate-900/80 dark:hover:border-emerald-400/70"
        >
          <div className="inline-flex items-center gap-2 text-[12px] font-semibold text-slate-900 dark:text-slate-50">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 text-xs">
              👥
            </span>
            <span>Agents &amp; availability</span>
          </div>
          <p className="mt-1 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
            Add agents, define roles and control who can reply to customers.
          </p>
        </button>

        {/* Automation */}
        <button
          type="button"
          className="group flex flex-col items-start gap-1 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-left shadow-sm shadow-slate-900/5 hover:border-emerald-500/70 hover:shadow-md hover:shadow-emerald-500/10 transition-all dark:border-slate-800/80 dark:bg-slate-900/80 dark:hover:border-emerald-400/70"
        >
          <div className="inline-flex items-center gap-2 text-[12px] font-semibold text-slate-900 dark:text-slate-50">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/10 text-sky-500 text-xs">
              ⚙️
            </span>
            <span>Automation scenarios</span>
          </div>
          <p className="mt-1 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
            Draft flows for welcome messages, offline replies and lead capture.
          </p>
        </button>

        {/* Data & privacy */}
        <button
          type="button"
          className="group flex flex-col items-start gap-1 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-left shadow-sm shadow-slate-900/5 hover:border-emerald-500/70 hover:shadow-md hover:shadow-emerald-500/10 transition-all dark:border-slate-800/80 dark:bg-slate-900/80 dark:hover:border-emerald-400/70"
        >
          <div className="inline-flex items-center gap-2 text-[12px] font-semibold text-slate-900 dark:text-slate-50">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/10 text-violet-500 text-xs">
              🔒
            </span>
            <span>Data &amp; privacy</span>
          </div>
          <p className="mt-1 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
            Later you can plug GDPR tools, data retention and export options here.
          </p>
        </button>
      </div>
    </section>
  );
};