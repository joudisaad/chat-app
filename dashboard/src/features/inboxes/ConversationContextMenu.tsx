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

  const handleRootClick: React.MouseEventHandler<HTMLDivElement> = () => {
    onClose();
  };

  const handleMenuClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
  };

  const isEtiquetteChecked = (tagId: string) =>
    (conversationEtiquettes || []).some((e) => e.id === tagId);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
      }}
      onClick={handleRootClick}
    >
      <div
        style={{
          position: "absolute",
          top: contextMenu.y,
          left: contextMenu.x,
          minWidth: 220,
        }}
        onClick={handleMenuClick}
        className="rounded-xl border border-slate-200 bg-white/95 text-slate-900 shadow-2xl backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100"
      >
        {/* --- Move to inbox section --- */}
        <div className="border-b border-slate-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Move conversation to inbox
        </div>

        <div className="py-1">
          {inboxes.map((inbox) => {
            const isCurrent = inbox.id === currentInboxId;
            return (
              <button
                key={inbox.id}
                type="button"
                onClick={() => onMoveToInbox(inbox.id)}
                className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                <span>{inbox.name}</span>
                {isCurrent && (
                  <span className="text-[11px] text-emerald-500">✓</span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => onMoveToInbox(null)}
            className="flex w-full items-center justify-between px-3 py-1.5 text-left text-[11px] text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <span>All conversations (no sub-inbox)</span>
            {!currentInboxId && (
              <span className="text-[11px] text-emerald-500">✓</span>
            )}
          </button>
        </div>

        {/* --- Divider --- */}
        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

        {/* --- Assignment section --- */}
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
          Assignment
        </div>
        <div className="pb-1">
          <button
            type="button"
            onClick={() => {
              if (!currentUserId) return;
              onAssign(currentUserId);
              onClose();
            }}
            className={`flex w-full items-center px-3 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 ${
              currentUserId
                ? "cursor-pointer text-slate-800 dark:text-slate-100"
                : "cursor-not-allowed text-slate-400 dark:text-slate-500"
            }`}
          >
            Assign to me
          </button>
          <button
            type="button"
            onClick={() => {
              onAssign(null);
              onClose();
            }}
            className="flex w-full items-center px-3 py-1.5 text-left text-[11px] text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Unassign
          </button>
        </div>

        {/* --- Divider --- */}
        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

        {/* --- Status section --- */}
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
          Status
        </div>
        <div className="pb-1">
          <button
            type="button"
            onClick={() => onUpdateStatus("OPEN")}
            className="flex w-full items-center px-3 py-1.5 text-left text-xs text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Mark as open
          </button>
          <button
            type="button"
            onClick={() => onUpdateStatus("PENDING")}
            className="flex w-full items-center px-3 py-1.5 text-left text-xs text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Mark as pending
          </button>
          <button
            type="button"
            onClick={() => onUpdateStatus("RESOLVED")}
            className="flex w-full items-center px-3 py-1.5 text-left text-xs text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Mark as resolved
          </button>
        </div>

        {/* --- Labels section --- */}
        {etiquettes && etiquettes.length > 0 && onApplyEtiquette && (
          <>
            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
              Labels
            </div>
            <div className="pb-1">
              {etiquettes.map((tag) => {
                const checked = isEtiquetteChecked(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() =>
                      onApplyEtiquette(contextMenu.conversationId, tag.id)
                    }
                    className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded border border-slate-300 text-[10px] text-emerald-500 dark:border-slate-600">
                        {checked ? "✓" : ""}
                      </span>
                      <span
                        className="h-3 w-3 rounded-full border border-slate-200 dark:border-slate-600"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="truncate max-w-[120px] text-slate-800 dark:text-slate-100">
                        {tag.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}