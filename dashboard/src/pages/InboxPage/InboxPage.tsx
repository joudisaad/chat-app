// src/pages/InboxPage/InboxPage.tsx
import type { RouteComponentProps } from "../../app/routes";
import { useEffect, useState } from "react";
import AgentDashboard from "../../AgentDashboard";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

interface Inbox {
  id: string;
  name: string;
}

export function InboxPage(props: RouteComponentProps) {
  const [inboxes, setInboxes] = useState<Inbox[]>([]);
  const [activeInboxId, setActiveInboxId] = useState<string | null>(null);

  const [renameTarget, setRenameTarget] = useState<Inbox | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Inbox | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newInboxName, setNewInboxName] = useState("");

  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("CHATAPP_TOKEN")
      : null;

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function loadInboxes() {
      try {
        const res = await fetch(`${API_URL}/inboxes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Inbox[];
        if (!cancelled) {
          setInboxes(data);
        }
      } catch (e) {
        console.error("Failed to load inboxes in InboxPage", e);
      }
    }

    loadInboxes();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Escape key closes any open modal
  useEffect(() => {
    if (!isCreateModalOpen && !renameTarget && !deleteTarget) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCreateModalOpen(false);
        setRenameTarget(null);
        setDeleteTarget(null);
        setNewInboxName("");
        setRenameValue("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCreateModalOpen, renameTarget, deleteTarget]);

  const createInbox = async (name: string) => {
    if (!token) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      setIsSaving(true);
      const res = await fetch(`${API_URL}/inboxes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const inbox = (await res.json()) as Inbox;
      setInboxes((prev) => [...prev, inbox]);
      setActiveInboxId(inbox.id);
    } catch (e) {
      console.error("Failed to create inbox from InboxPage", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRenameInbox = (inbox: Inbox) => {
    setRenameTarget(inbox);
    setRenameValue(inbox.name);
  };

  const handleConfirmRename = async () => {
    if (!token || !renameTarget) return;
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === renameTarget.name) {
      setRenameTarget(null);
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch(
        `${API_URL}/inboxes/${encodeURIComponent(renameTarget.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: trimmed }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = (await res.json()) as Inbox;
      setInboxes((prev) =>
        prev.map((i) => (i.id === updated.id ? updated : i))
      );
      window.dispatchEvent(new CustomEvent("chatapp:inboxes-updated"));
      setRenameTarget(null);
    } catch (e) {
      console.error("Failed to rename inbox from InboxPage", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteInbox = (inbox: Inbox) => {
    setDeleteTarget(inbox);
  };

  const handleConfirmDelete = async () => {
    if (!token || !deleteTarget) return;

    try {
      setIsSaving(true);
      const res = await fetch(
        `${API_URL}/inboxes/${encodeURIComponent(deleteTarget.id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setInboxes((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setActiveInboxId((current) =>
        current === deleteTarget.id ? null : current
      );
      window.dispatchEvent(new CustomEvent("chatapp:inboxes-updated"));
      setDeleteTarget(null);
    } catch (e) {
      console.error("Failed to delete inbox from InboxPage", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* SIDEBAR: Inbox list (ALL + sub-inboxes) */}
      <div className="flex h-full w-60 flex-col border-r border-slate-200 bg-slate-50/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/40">
        <div className="px-4 pb-2 pt-4 text-slate-900 dark:text-slate-100">
          <div className="text-sm font-semibold">Inbox</div>
          <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            Default inboxes
          </div>
        </div>

        <div className="mt-1 flex-1 overflow-y-auto px-2 pb-3">
          {/* ALL = main inbox */}
          <button
            type="button"
            onClick={() => setActiveInboxId(null)}
            className={`mb-1 flex w-full items-center justify-between rounded-full px-3 py-1.5 text-xs transition ${
              activeInboxId === null
                ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-300"
                : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="truncate font-medium">All conversations</span>
            </div>
          </button>

          {inboxes.map((inbox) => {
            const active = inbox.id === activeInboxId;
            return (
              <div
                key={inbox.id}
                onClick={() => setActiveInboxId(inbox.id)}
                className={`mb-1 flex w-full cursor-pointer items-center justify-between rounded-full px-3 py-1.5 text-xs transition ${
                  active
                    ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-300"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <span className="flex-1 truncate">{inbox.name}</span>
                <div className="ml-2 flex items-center gap-1.5">
                  {/* Edit (rename) icon */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRenameInbox(inbox);
                    }}
                    title="Rename sub-inbox"
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 13.5V16h2.5L15 7.5 12.5 5 4 13.5z" />
                      <path d="M11.5 4L13 2.5a1.5 1.5 0 1 1 2.12 2.12L13.62 6.12" />
                    </svg>
                  </button>

                  {/* Delete icon */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteInbox(inbox);
                    }}
                    title="Delete sub-inbox"
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-500 hover:bg-red-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/40 dark:hover:text-red-300"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 6.5h10" />
                      <path d="M8 6.5V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5" />
                      <path d="M7.5 6.5 8 15a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1l.5-8.5" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => {
              setNewInboxName("");
              setIsCreateModalOpen(true);
            }}
            title="Add sub-inbox"
            className="mt-2 inline-flex w-full items-center gap-2 rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-slate-600 dark:text-slate-400 dark:hover:border-emerald-500 dark:hover:text-emerald-300"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-base leading-none dark:border-slate-600">
              +
            </span>
            <span className="truncate">Add sub-inbox</span>
          </button>
        </div>
      </div>

      {/* MAIN PANEL */}
      <div className="flex flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-1 overflow-hidden">
          <AgentDashboard team={props.team} activeInboxId={activeInboxId} />
        </div>
      </div>

      {/* Create Inbox Modal */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
          onClick={() => {
            if (isSaving) return;
            setIsCreateModalOpen(false);
            setNewInboxName("");
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-1 text-[15px] font-semibold text-slate-900 dark:text-slate-100">
              Create sub-inbox
            </h3>
            <p className="mb-3 text-[12px] text-slate-500 dark:text-slate-400">
              Organize your conversations into folders like “VIP clients”,
              “Bugs”, or “Billing”.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await createInbox(newInboxName);
                setIsCreateModalOpen(false);
                setNewInboxName("");
              }}
            >
              <input
                autoFocus
                value={newInboxName}
                onChange={(e) => setNewInboxName(e.target.value)}
                className="mb-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="Sub-inbox name"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewInboxName("");
                  }}
                  disabled={isSaving}
                  className="inline-flex items-center rounded-lg px-3 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !newInboxName.trim()}
                  className="inline-flex items-center rounded-lg bg-emerald-500 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-500/60"
                >
                  {isSaving ? "Creating..." : "Create sub-inbox"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Inbox Modal */}
      {renameTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
          onClick={() => {
            if (isSaving) return;
            setRenameTarget(null);
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-1 text-[15px] font-semibold text-slate-900 dark:text-slate-100">
              Rename sub-inbox
            </h3>
            <p className="mb-3 text-[12px] text-slate-500 dark:text-slate-400">
              Update the name for this sub-inbox. Conversations stay inside,
              only the label changes.
            </p>
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="mb-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
              placeholder="Sub-inbox name"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                disabled={isSaving}
                className="inline-flex items-center rounded-lg px-3 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmRename()}
                disabled={isSaving}
                className="inline-flex items-center rounded-lg bg-emerald-500 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-500/60"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Inbox Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
          onClick={() => {
            if (isSaving) return;
            setDeleteTarget(null);
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-1 text-[15px] font-semibold text-slate-900 dark:text-slate-100">
              Delete sub-inbox
            </h3>
            <p className="mb-3 text-[12px] text-slate-500 dark:text-slate-400">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteTarget.name}</span>?<br />
              Conversations will not be deleted, they will just appear in{" "}
              <span className="font-medium">All conversations</span>.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isSaving}
                className="inline-flex items-center rounded-lg px-3 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={isSaving}
                className="inline-flex items-center rounded-lg bg-red-500 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-500/60"
              >
                {isSaving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}