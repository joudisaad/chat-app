import React, { useState, useRef, useEffect } from "react";
import type { MouseEvent } from "react";
import type { Team } from "../../App";
import type { Conversation } from "../../AgentDashboard";

interface ConversationListProps {
  team: Team | null;
  conversations: Conversation[];
  filteredConversations: Conversation[];
  loadingConvos: boolean;
  activeInboxId?: string | null;
  activeRoomId: string | null;
  currentUserId: string | null;
  etiquettes?: { id: string; name: string; color: string; slug?: string }[];
  onCreateEtiquette?: (data: { name: string; color: string }) => void;
  onDeleteEtiquette?: (id: string) => void;
  onSelectRoom: (roomId: string) => void;
  onContextMenu: (
    event: MouseEvent<HTMLButtonElement>,
    conversationId: string
  ) => void;
  selectedEtiquette?: string | null;
  setSelectedEtiquette?: (etag: string | null) => void;
}

export function ConversationList({
  team,
  conversations,
  filteredConversations,
  loadingConvos,
  activeInboxId,
  activeRoomId,
  currentUserId,
  etiquettes,
  onCreateEtiquette,
  onDeleteEtiquette,
  onSelectRoom,
  onContextMenu,
  selectedEtiquette,
  setSelectedEtiquette,
}: ConversationListProps) {
  const [newEtiquetteName, setNewEtiquetteName] = useState("");
  const [newEtiquetteColor, setNewEtiquetteColor] = useState("#22c55e");
  const [isCreatingEtiquette, setIsCreatingEtiquette] = useState(false);
  const [isEtiquetteMenuOpen, setIsEtiquetteMenuOpen] = useState(false);
  const [etiquetteToDelete, setEtiquetteToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isEtiquetteMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsEtiquetteMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEtiquetteMenuOpen]);

  const truncateEtiquetteName = (name: string) =>
    name.length > 10 ? name.slice(0, 10) + "…" : name;

  const selectedTag = etiquettes?.find((t) => t.slug === selectedEtiquette) || null;

  return (
    <div className="agent-dashboard-column agent-dashboard-conversations convo-column">
      {/* Search bar */}
      <div className="agent-dashboard-search convo-search">
        <input
          placeholder="Search conversations…"
          className="convo-search-input"
        />
      </div>

      {onCreateEtiquette && (
        <div className="convo-etiquette-panel convo-etiquette-panel--compact">
          <div className="convo-etiquette-header">

            <div className="convo-etiquette-dropdown" ref={dropdownRef}>
              <button
                type="button"
                className="convo-etiquette-dropdown-toggle"
                onClick={() => setIsEtiquetteMenuOpen((prev) => !prev)}
              >
                <span className="convo-etiquette-dropdown-pill">
                  {selectedTag ? (
                    <>
                      <span
                        className="convo-etiquette-dropdown-dot"
                        style={{ backgroundColor: selectedTag.color }}
                      />
                      {truncateEtiquetteName(selectedTag.name)}
                    </>
                  ) : (
                    <>
                      <span className="convo-etiquette-dropdown-dot is-all" />
                      <span className="convo-etiquette-label-text">Labels</span>
                    </>
                  )}
                </span>
                <span className="convo-etiquette-dropdown-caret">▾</span>
              </button>

              {isEtiquetteMenuOpen && (
                <div className="convo-etiquette-dropdown-menu etiq-menu-bg">
                  <button
                    type="button"
                    className={
                      "convo-etiquette-dropdown-item" +
                      (!selectedEtiquette ? " is-active" : "")
                    }
                    onClick={() => {
                      setSelectedEtiquette?.(null);
                      setIsEtiquetteMenuOpen(false);
                    }}
                  >
                    <span className="convo-etiquette-dropdown-dot is-all" />
                    All Labels
                  </button>

                  {etiquettes?.map((tag) => (
                    <div
                      key={tag.id}
                      role="button"
                      tabIndex={0}
                      className={
                        "convo-etiquette-dropdown-item" +
                        (selectedEtiquette === tag.slug ? " is-active" : "")
                      }
                      onClick={() => {
                        setSelectedEtiquette?.(tag.slug || null);
                        setIsEtiquetteMenuOpen(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedEtiquette?.(tag.slug || null);
                          setIsEtiquetteMenuOpen(false);
                        }
                      }}
                    >
                      <span className="convo-etiquette-dropdown-left">
                        <span
                          className="convo-etiquette-dropdown-dot"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="convo-etiquette-dropdown-name">
                          {truncateEtiquetteName(tag.name)}
                        </span>
                      </span>
                      <button
                        type="button"
                        className="convo-etiquette-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEtiquetteMenuOpen(false);
                          setEtiquetteToDelete({ id: tag.id, name: tag.name });
                        }}
                        aria-label={`Delete etiquette ${tag.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  <div className="convo-etiquette-dropdown-separator" />

                  <button
                    type="button"
                    className="convo-etiquette-dropdown-item is-add"
                    onClick={() => {
                      setIsCreatingEtiquette(true);
                      setIsEtiquetteMenuOpen(false);
                    }}
                  >
                    <span className="convo-etiquette-dropdown-plus">+</span>
                    Add Label
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="agent-dashboard-conversation-list convo-list">
        {loadingConvos && (
          <div className="convo-empty-state">Loading conversations…</div>
        )}

        {!loadingConvos && conversations.length === 0 && !activeInboxId && (
          <div className="convo-empty-state">
            No conversations yet. New visitors will appear here.
          </div>
        )}

        {!loadingConvos &&
          conversations.length > 0 &&
          activeInboxId &&
          filteredConversations.length === 0 && (
            <div className="convo-empty-state">
              No conversations in this inbox yet.
              <br />
              Move a conversation here using the right-click menu.
            </div>
          )}

        {filteredConversations.map((c) => {
          const active = c.roomId === activeRoomId;
          const assigneeLabel = c.assigneeId
            ? c.assigneeId === currentUserId
              ? "Assigned to you"
              : c.assigneeName
              ? `Assigned to ${c.assigneeName}`
              : "Assigned"
            : "Unassigned";

          const unreadCount = (c as any).unreadCount ?? 0;
          const isUnread = unreadCount > 0;

          const seenByLabel =
            !isUnread && (c as any).lastReadByAgentName
              ? (c as any).lastReadByAgentId === currentUserId
                ? "Seen by you"
                : `Seen by ${(c as any).lastReadByAgentName}`
              : null;

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectRoom(c.roomId)}
              onContextMenu={(e) => onContextMenu(e, c.id)}
              className={
                "convo-item" +
                (active ? " is-active" : "") +
                (isUnread ? " is-unread" : "") +
                (c.status ? ` status-${c.status.toLowerCase()}` : "")
              }
            >
              <div className="convo-item-top">
                <span className="convo-item-title">
                  Visitor {c.roomId.slice(-5)}
                </span>
                <span className="convo-item-time">
                  {new Date(c.lastMessageAt).toLocaleTimeString()}
                </span>
              </div>

              <div className="convo-item-preview">
                {c.lastPreview || "No messages yet"}
              </div>

              <div className="convo-item-bottom">
                <span className="convo-item-assignee">{assigneeLabel}</span>
                <div className="convo-item-meta">
                  {isUnread ? (
                    <span className="convo-item-unread-badge">
                      <span className="convo-item-unread-count">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                      <span className="convo-item-unread-label">new</span>
                    </span>
                  ) : seenByLabel ? (
                    <span className="convo-item-seen-by">{seenByLabel}</span>
                  ) : null}
                  {c.etiquettes && c.etiquettes.length > 0 && (
                    <div className="convo-item-tags flex items-center gap-1">
                      {c.etiquettes.map((tag: { id: string; name: string; color: string }) => (
                        <span
                          key={tag.id}
                          className="inline-flex h-2.5 w-2.5 rounded-full border border-white/40 shadow-sm"
                          style={{ backgroundColor: tag.color }}
                          title={tag.name}
                        />
                      ))}
                    </div>
                  )}
                  {c.status && (
                    <span
                      className={
                        "convo-item-status status-" +
                        c.status.toLowerCase()
                      }
                    >
                      {c.status.toLowerCase()}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {etiquetteToDelete && (
        <div
          className="convo-etiquette-modal-overlay"
          onClick={() => setEtiquetteToDelete(null)}
        >
          <div className="convo-etiquette-modal" onClick={(e) => e.stopPropagation()}>
            <div className="convo-etiquette-form">
              <div className="convo-etiquette-modal-header-row">
                <div>
                  <div className="convo-etiquette-modal-title">
                    Delete etiquette?
                  </div>
                  <div className="convo-etiquette-modal-subtitle">
                    This will remove the label{" "}
                    <strong>{etiquetteToDelete.name}</strong> from your team.
                    Conversations will no longer show this etiquette.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEtiquetteToDelete(null)}
                  className="convo-etiquette-modal-esc"
                >
                  Esc
                </button>
              </div>

              <div className="convo-etiquette-modal-actions" style={{ marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setEtiquetteToDelete(null)}
                  className="convo-etiquette-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="convo-etiquette-btn-submit"
                  style={{ backgroundColor: "#ef4444", color: "#fef2f2" }}
                  onClick={() => {
                    if (etiquetteToDelete) {
                      onDeleteEtiquette?.(etiquetteToDelete.id);
                    }
                    setEtiquetteToDelete(null);
                  }}
                >
                  Delete etiquette
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCreatingEtiquette && (
        <div
          className="convo-etiquette-modal-overlay"
          onClick={() => {
            setIsCreatingEtiquette(false);
            setNewEtiquetteName("");
          }}
        >
          <div className="convo-etiquette-modal" onClick={(e) => e.stopPropagation()}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const name = newEtiquetteName.trim();
                if (!name) return;
                onCreateEtiquette?.({ name, color: newEtiquetteColor });
                setNewEtiquetteName("");
                setIsCreatingEtiquette(false);
              }}
              className="convo-etiquette-form"
            >
              <div className="convo-etiquette-modal-header-row">
                <div>
                  <div className="convo-etiquette-modal-title">
                    Create etiquette
                  </div>
                  <div className="convo-etiquette-modal-subtitle">
                    Group conversations with colorful labels your team can
                    filter by.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingEtiquette(false);
                    setNewEtiquetteName("");
                  }}
                  className="convo-etiquette-modal-esc"
                >
                  Esc
                </button>
              </div>

              {/* Preview pill */}
              <div className="convo-etiquette-modal-preview-row">
                <span className="convo-etiquette-modal-preview-label">
                  Preview
                </span>
                <span
                  className="convo-etiquette-modal-preview-pill"
                  style={{
                    borderColor: newEtiquetteColor,
                    backgroundColor: `${newEtiquetteColor}1a`,
                    color: newEtiquetteColor,
                  }}
                >
                  <span
                    className="convo-etiquette-tag-dot"
                    style={{ backgroundColor: newEtiquetteColor }}
                  />
                  {newEtiquetteName || "New label"}
                </span>
              </div>

              <div className="convo-etiquette-modal-fields">
                <label className="convo-etiquette-field-label">
                  Name
                  <input
                    type="text"
                    value={newEtiquetteName}
                    onChange={(e) => setNewEtiquetteName(e.target.value)}
                    placeholder="ex: VIP, Bugs, Priority"
                    className="convo-etiquette-input"
                    autoFocus
                  />
                </label>

                <label className="convo-etiquette-field-label convo-etiquette-color-row">
                  Color
                  <input
                    type="color"
                    value={newEtiquetteColor}
                    onChange={(e) => setNewEtiquetteColor(e.target.value)}
                    className="convo-etiquette-color-input"
                  />
                </label>
              </div>

              <div className="convo-etiquette-modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingEtiquette(false);
                    setNewEtiquetteName("");
                  }}
                  className="convo-etiquette-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="convo-etiquette-btn-submit"
                >
                  Add etiquette
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}