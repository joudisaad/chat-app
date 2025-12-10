import React, { useEffect, useState } from "react";
import type { Theme, Team } from "../../App";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const WIDGET_URL = import.meta.env.VITE_WIDGET_URL ?? "http://localhost:4173";

export interface WidgetSettingsResponse {
  position: "bottom-right" | "bottom-left";
  launcherColor: string;
  textColor: string;
}

interface WidgetSettingsPanelProps {
  theme: Theme;
  onThemeChange: (t: Theme) => void;
  team: Team | null;
}

export const WidgetSettingsPanel: React.FC<WidgetSettingsPanelProps> = ({
  theme,
  onThemeChange,
  team,
}) => {
  const [position, setPosition] = useState<"bottom-right" | "bottom-left">("bottom-right");
  const [launcherColor, setLauncherColor] = useState<string>("#22c55e");
  const [textColor, setTextColor] = useState<string>("#ffffff");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<boolean>(false);

  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("CHATAPP_TOKEN")
      : null;

  // Load current settings from API
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadSettings() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/widget-settings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as WidgetSettingsResponse;
        if (!cancelled && data) {
          if (data.position) setPosition(data.position);
          if (data.launcherColor) setLauncherColor(data.launcherColor);
          if (data.textColor) setTextColor(data.textColor);
        }
      } catch (e: any) {
        console.error("Failed to load widget settings", e);
        if (!cancelled) setError("Failed to load widget settings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSettings();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`${API_URL}/widget-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ position, launcherColor, textColor }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || `HTTP ${res.status}`);
      }
      setSaved(true);
    } catch (e: any) {
      console.error("Failed to save widget settings", e);
      setError(e.message || "Failed to save widget settings");
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const installSnippet = team?.publicKey
    ? `<script>
  window.CHATAPP_KEY = "${team.publicKey}";
  (function(){
    var s = document.createElement('script');
    s.src = '${WIDGET_URL}/widget.js';
    s.async = true;
    document.head.appendChild(s);
  })();
</script>`
    : "You need a team public key to generate the install snippet.";

  return (
    <div className="space-y-6 text-[13px] text-[color:var(--text-secondary)]">
      {/* Header */}
      <header className="space-y-1">
        <h2 className="m-0 text-[18px] font-semibold text-[color:var(--text-primary)]">
          Widget appearance &amp; install
        </h2>
        <p className="m-0 text-[13px]">
          Control how the chat launcher looks on your website.
        </p>
      </header>

      {loading ? (
        <div className="text-[13px]">Loading widget settings…</div>
      ) : (
        <>
          {/* Main layout: form + preview */}
          <section className="space-y-6 md:grid md:grid-cols-2 md:space-y-0 md:gap-6 items-start mb-4">
            {/* Left: form fields */}
            <div className="flex flex-col gap-4">
              {/* Position */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
                  Launcher position
                </div>
                <div className="text-[12px] text-[color:var(--text-secondary)]">
                  Choose where the chat bubble appears on your pages.
                </div>
                <div className="flex gap-2">
                  {[
                    { id: "bottom-right", label: "Bottom right" },
                    { id: "bottom-left", label: "Bottom left" },
                  ].map((opt) => {
                    const selected = position === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPosition(opt.id as any)}
                        className={[
                          "flex-1 rounded-lg px-3 py-1.5 text-[12px] border transition-colors",
                          selected
                            ? "border-emerald-500 bg-emerald-500/10 text-[color:var(--text-primary)]"
                            : "border-[color:var(--border-color)] text-[color:var(--text-secondary)] hover:border-emerald-500/70 hover:bg-emerald-500/5",
                        ].join(" ")}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
                    Launcher color
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-[color:var(--border-color)] bg-[color:var(--bg-subpanel)] px-3 py-2">
                    <input
                      type="color"
                      value={launcherColor}
                      onChange={(e) => setLauncherColor(e.target.value)}
                      className="h-7 w-7 cursor-pointer rounded-md border border-black/10"
                    />
                    <span className="truncate text-[12px] text-[color:var(--text-secondary)]">
                      {launcherColor}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
                    Text &amp; icon color
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-[color:var(--border-color)] bg-[color:var(--bg-subpanel)] px-3 py-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="h-7 w-7 cursor-pointer rounded-md border border-black/10"
                    />
                    <span className="truncate text-[12px] text-[color:var(--text-secondary)]">
                      {textColor}
                    </span>
                  </div>
                </div>
              </div>

              {/* Save button + status */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  className={[
                    "inline-flex items-center rounded-full px-4 py-2 text-[13px] font-medium",
                    saving
                      ? "bg-slate-600 text-slate-200 cursor-default"
                      : "bg-emerald-500 text-emerald-950 hover:bg-emerald-400 transition-colors",
                  ].join(" ")}
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>

                {saved && (
                  <span className="text-[12px] text-emerald-400">Saved.</span>
                )}

                {error && (
                  <span className="text-[12px] text-rose-400">{error}</span>
                )}
              </div>
            </div>

            {/* Right: live preview */}
            <div
              className={[
                "rounded-xl border border-[color:var(--border-color)] bg-[color:var(--bg-subpanel)] p-4 min-h-[140px] flex items-end",
                position === "bottom-right" ? "justify-end" : "justify-start",
              ].join(" ")}
            >
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] shadow-[0_12px_30px_rgba(15,23,42,0.45)] cursor-default"
                style={{ background: launcherColor, color: textColor }}
              >
                <span
                  className="h-4.5 w-4.5 rounded-full border-[2px] border-white/70"
                  style={{ width: 18, height: 18 }}
                />
                <span>Chat with us</span>
              </div>
            </div>
          </section>

          {/* Install snippet */}
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
                  Install on your website
                </div>
                <div className="text-[12px] text-[color:var(--text-secondary)]">
                  Paste this before the closing {"</body>"} tag on your site.
                </div>
              </div>
            </div>

            <textarea
              readOnly
              value={installSnippet}
              className="w-full min-h-[150px] rounded-xl border border-[color:var(--border-color)] bg-[color:var(--bg-subpanel)] text-[color:var(--text-primary)] font-mono text-[12px] p-3 resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500/70"
            />
          </section>
        </>
      )}
    </div>
  );
};

export default WidgetSettingsPanel;