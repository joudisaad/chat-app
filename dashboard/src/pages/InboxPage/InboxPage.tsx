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
    <div
      style={{
        width: "100%",           // ✅ FULL WIDTH
        height: "100%",          // ✅ FULL HEIGHT
        display: "flex",
        flexDirection: "row",    // Sidebar + main area
        overflow: "hidden",
      }}
    >
      {/* SIDEBAR: Inbox list (ALL + sub-inboxes) */}
      <div
        style={{
          width: 240,            // Crisp-style sidebar width
          background: "var(--bg-panel)",
          borderRight: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 16px 8px",
            color: "var(--text-primary)",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600 }}>Inbox</div>
          <div
            style={{
              marginTop: 6,
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 0.06,
              color: "var(--text-secondary)",
            }}
          >
            Default inboxes
          </div>
        </div>

        <div
          style={{
            padding: "4px 8px 8px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            overflowY: "auto",
          }}
        >
          {/* ALL = main inbox (no filter yet at page level) */}
          <button
            type="button"
            onClick={() => setActiveInboxId(null)}
            style={{
              borderRadius: 999,
              border:
                activeInboxId === null
                  ? "1px solid var(--accent-color, #22c55e)"
                  : "1px solid var(--border-color)",
              padding: "6px 10px",
              fontSize: 12,
              background:
                activeInboxId === null
                  ? "rgba(34,197,94,0.12)"
                  : "var(--bg-subpanel)",
              color:
                activeInboxId === null
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            ALL
          </button>

          {inboxes.map((inbox) => {
            const active = inbox.id === activeInboxId;
            return (
              <div
                key={inbox.id}
                onClick={() => setActiveInboxId(inbox.id)}
                style={{
                  borderRadius: 999,
                  border: active
                    ? "1px solid var(--accent-color, #22c55e)"
                    : "1px solid var(--border-color)",
                  padding: "4px 8px",
                  fontSize: 12,
                  background: active
                    ? "rgba(34,197,94,0.12)"
                    : "var(--bg-subpanel)",
                  color: active
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    flex: 1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {inbox.name}
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleRenameInbox(inbox);
                    }}
                    title="Rename sub-inbox"
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "var(--text-secondary)",
                      fontSize: 11,
                      cursor: "pointer",
                      padding: 2,
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDeleteInbox(inbox);
                    }}
                    title="Delete sub-inbox"
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "var(--text-secondary)",
                      fontSize: 11,
                      cursor: "pointer",
                      padding: 2,
                    }}
                  >
                    🗑
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
            style={{
              marginTop: 8,
              borderRadius: 999,
              border: "1px dashed var(--border-color)",
              background: "transparent",
              color: "var(--text-secondary)",
              fontSize: 12,
              padding: "6px 10px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: "999px",
                border: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                lineHeight: 1,
              }}
            >
              +
            </span>
            <span>Add sub-inbox</span>
          </button>
        </div>
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


        {/* DASHBOARD */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            padding: 0, // full-width workspace, no inner padding
          }}
        >
          <AgentDashboard team={props.team} activeInboxId={activeInboxId} />
        </div>
      </div>
      {/* Create Inbox Modal */}
      {isCreateModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "var(--bg-panel)",
              borderRadius: 12,
              border: "1px solid var(--border-color)",
              boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
              width: 380,
              maxWidth: "90vw",
              padding: "18px 20px 16px",
              color: "var(--text-primary)",
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              Create sub-inbox
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                marginBottom: 12,
              }}
            >
              Organize your conversations into folders like “VIP clients”, “Bugs”, or “Billing”.
            </div>
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
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-subpanel)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  outline: "none",
                  marginBottom: 14,
                }}
                placeholder="Sub-inbox name"
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 4,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewInboxName("");
                  }}
                  disabled={isSaving}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: "1px solid var(--border-color)",
                    background: "transparent",
                    color: "var(--text-secondary)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !newInboxName.trim()}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    border: "none",
                    background:
                      "var(--accent-color, linear-gradient(135deg,#22c55e,#16a34a))",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    opacity: isSaving || !newInboxName.trim() ? 0.7 : 1,
                  }}
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
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "var(--bg-panel)",
              borderRadius: 12,
              border: "1px solid var(--border-color)",
              boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
              width: 380,
              maxWidth: "90vw",
              padding: "18px 20px 16px",
              color: "var(--text-primary)",
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              Rename sub-inbox
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                marginBottom: 12,
              }}
            >
              Update the name for this sub-inbox. Conversations will stay inside,
              only the label changes.
            </div>
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid var(--border-color)",
                background: "var(--bg-subpanel)",
                color: "var(--text-primary)",
                fontSize: 13,
                outline: "none",
                marginBottom: 14,
              }}
              placeholder="Sub-inbox name"
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 4,
              }}
            >
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                disabled={isSaving}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: "1px solid var(--border-color)",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmRename()}
                disabled={isSaving}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "none",
                  background:
                    "var(--accent-color, linear-gradient(135deg,#22c55e,#16a34a))",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  opacity: isSaving ? 0.7 : 1,
                }}
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
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "var(--bg-panel)",
              borderRadius: 12,
              border: "1px solid var(--border-color)",
              boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
              width: 380,
              maxWidth: "90vw",
              padding: "18px 20px 16px",
              color: "var(--text-primary)",
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              Delete sub-inbox
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                marginBottom: 12,
              }}
            >
              Are you sure you want to delete{" "}
              <span style={{ fontWeight: 600 }}>{deleteTarget.name}</span>?{" "}
              Conversations will not be deleted, they will just appear in{" "}
              <span style={{ fontWeight: 500 }}>All conversations</span>.
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 4,
              }}
            >
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isSaving}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: "1px solid var(--border-color)",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={isSaving}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "none",
                  background:
                    "linear-gradient(135deg, #ef4444, #b91c1c)", // red gradient
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  opacity: isSaving ? 0.7 : 1,
                }}
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