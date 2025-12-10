import type { Inbox, Etiquette } from "../../AgentDashboard";

interface ContextMenuState {
  x: number;
  y: number;
  conversationId: string;
}

interface ConversationContextMenuProps {
  contextMenu: ContextMenuState | null;
  inboxes: Inbox[];
  currentInboxId: string | null;
  currentUserId: string | null;
  etiquettes?: Etiquette[];
  conversationEtiquettes?: Etiquette[];
  onClose: () => void;
  onMoveToInbox: (inboxId: string | null) => void;
  onAssign: (assigneeId: string | null) => void;
  onUpdateStatus: (status: "OPEN" | "PENDING" | "RESOLVED") => void;
  onApplyEtiquette?: (conversationId: string, etiquetteId: string) => void;
}

export function ConversationContextMenu({
  contextMenu,
  inboxes,
  currentInboxId,
  currentUserId,
  etiquettes,
  conversationEtiquettes,
  onClose,
  onMoveToInbox,
  onAssign,
  onUpdateStatus,
  onApplyEtiquette,
}: ConversationContextMenuProps) {
  if (!contextMenu) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "absolute",
          top: contextMenu.y,
          left: contextMenu.x,
          minWidth: 180,
          borderRadius: 8,
          background: "var(--bg-panel)",
          border: "1px solid var(--border-color)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
          padding: "6px 0",
          fontSize: 12,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "4px 10px 6px",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 0.04,
            color: "var(--text-secondary)",
          }}
        >
          Move conversation to inbox
        </div>
        {inboxes.map((inbox) => {
          const isCurrent = inbox.id === currentInboxId;
          return (
            <button
              key={inbox.id}
              onClick={() => onMoveToInbox(inbox.id)}
              style={{
                width: "100%",
                padding: "6px 10px",
                textAlign: "left",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 12,
              }}
            >
              <span>{inbox.name}</span>
              {isCurrent && (
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--accent-color, #22c55e)",
                  }}
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
        <button
          onClick={() => onMoveToInbox(null)}
          style={{
            width: "100%",
            padding: "6px 10px",
            textAlign: "left",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--text-secondary)",
            fontSize: 11,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>All conversations (no sub-inbox)</span>
          {!currentInboxId && (
            <span
              style={{
                fontSize: 11,
                color: "var(--accent-color, #22c55e)",
              }}
            >
              ✓
            </span>
          )}
        </button>

        <div
          style={{
            margin: "6px 0",
            borderTop: "1px solid var(--border-color)",
          }}
        />

        <div
          style={{
            padding: "4px 10px 6px",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 0.04,
            color: "var(--text-secondary)",
          }}
        >
          Assignment
        </div>
        <button
          onClick={() => {
            if (!currentUserId) return;
            onAssign(currentUserId);
            onClose();
          }}
          style={{
            width: "100%",
            padding: "6px 10px",
            textAlign: "left",
            background: "transparent",
            border: "none",
            cursor: currentUserId ? "pointer" : "not-allowed",
            color: "var(--text-primary)",
            opacity: currentUserId ? 1 : 0.6,
          }}
        >
          Assign to me
        </button>
        <button
          onClick={() => {
            onAssign(null);
            onClose();
          }}
          style={{
            width: "100%",
            padding: "6px 10px",
            textAlign: "left",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--text-secondary)",
            fontSize: 11,
          }}
        >
          Unassign
        </button>

        <div
          style={{
            margin: "6px 0",
            borderTop: "1px solid var(--border-color)",
          }}
        />

        <div
          style={{
            padding: "4px 10px 6px",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 0.04,
            color: "var(--text-secondary)",
          }}
        >
          Status
        </div>
        <button
          onClick={() => onUpdateStatus("OPEN")}
          style={{
            width: "100%",
            padding: "6px 10px",
            textAlign: "left",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--text-primary)",
          }}
        >
          Mark as open
        </button>
        <button
          onClick={() => onUpdateStatus("PENDING")}
          style={{
            width: "100%",
            padding: "6px 10px",
            textAlign: "left",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--text-primary)",
          }}
        >
          Mark as pending
        </button>
        <button
          onClick={() => onUpdateStatus("RESOLVED")}
          style={{
            width: "100%",
            padding: "6px 10px",
            textAlign: "left",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--text-primary)",
          }}
        >
          Mark as resolved
        </button>
        {etiquettes && etiquettes.length > 0 && onApplyEtiquette && (
          <>
            <div
              style={{
                margin: "6px 0",
                borderTop: "1px solid var(--border-color)",
              }}
            />

            <div
              style={{
                padding: "4px 10px 6px",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 0.04,
                color: "var(--text-secondary)",
              }}
            >
              Labels
            </div>

    {etiquettes.map((tag) => {
      const isChecked = (conversationEtiquettes || []).some(
        (e) => e.id === tag.id
      );

      return (
        <button
          key={tag.id}
          type="button"
          onClick={() =>
            onApplyEtiquette(contextMenu.conversationId, tag.id)
          }
          className={
            "context-menu-item" +
            (isChecked ? " context-menu-item-checked" : "")
          }
        >
          <span className="context-menu-check">
            {isChecked ? "✓" : ""}
          </span>
          <span
            className="context-menu-color-dot"
            style={{ backgroundColor: tag.color }}
          />
          <span className="context-menu-item-label">{tag.name}</span>
        </button>
      );
    })}
          </>
        )}
      </div>
    </div>
  );
}