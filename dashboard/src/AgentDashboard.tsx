// src/AgentDashboard.tsx
import {
  useCallback,
  useEffect,
  useState,
  useRef,
  type MouseEvent,
} from "react";
import { io, type Socket } from "socket.io-client";
import type { Team } from "./App";

interface Conversation {
  id: string;
  roomId: string;
  lastMessageAt: string;
  lastPreview: string | null;
  lastSender: string | null;
  inboxId?: string | null;
  status?: "OPEN" | "PENDING" | "RESOLVED";
  assigneeId?: string | null;
  assigneeName?: string | null;
}

interface Message {
  id: string;
  roomId: string;
  content: string;
  sender: string;
  createdAt: string;
}

interface Inbox {
  id: string;
  name: string;
  isDefault?: boolean;
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function getUserIdFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payloadJson = atob(parts[1]);
    const payload = JSON.parse(payloadJson);
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
interface AgentDashboardProps {
  team: Team | null;
  activeInboxId?: string | null;
}

export default function AgentDashboard({
  team,
  activeInboxId,
}: AgentDashboardProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loadingConvos, setLoadingConvos] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inboxes, setInboxes] = useState<Inbox[]>([]);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    conversationId: string;
  } | null>(null);

  // Message panel refs
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Socket.io client for real-time updates
  const socketRef = useRef<Socket | null>(null);
  const activeRoomRef = useRef<string | null>(null);

  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("CHATAPP_TOKEN")
      : null;
  const currentUserId = getUserIdFromToken(token);
      

  // Load conversations once we have a token
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function loadConversations() {
      setLoadingConvos(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/conversations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Conversation[];
        if (!cancelled) {
          setConversations(data);
          if (!activeRoomId && data.length > 0) {
            setActiveRoomId(data[0].roomId);
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || "Failed to load conversations");
        }
      } finally {
        if (!cancelled) {
          setLoadingConvos(false);
        }
      }
    }

    loadConversations();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadInboxes = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/inboxes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Inbox[];
      setInboxes(data);
      // activeInboxId === null => main inbox (ALL conversations)
    } catch (e) {
      console.error("Failed to load inboxes", e);
    }
  }, [token]);

  // Load inboxes once we have a token
  useEffect(() => {
    void loadInboxes();
  }, [loadInboxes]);

  // Refresh inboxes whenever the rest of the app signals an update
  useEffect(() => {
    const handler = () => {
      void loadInboxes();
    };
    window.addEventListener("chatapp:inboxes-updated", handler);
    return () => window.removeEventListener("chatapp:inboxes-updated", handler);
  }, [loadInboxes]);

  // Close context menu on global left-clicks
  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => {
      window.removeEventListener("click", close);
    };
  }, []);

  // Keep a ref of the active room for use in socket handlers
  useEffect(() => {
    activeRoomRef.current = activeRoomId;
  }, [activeRoomId]);

  // Connect to Socket.io for real-time messages
  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = io(API_URL, {
      transports: ["websocket"],
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect_error", (err) => {
      console.error("Socket connect error", err);
    });

    const handleNewMessage = (msg: Message) => {
      // Update messages in the currently active room
      if (activeRoomRef.current && msg.roomId === activeRoomRef.current) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }

      // Keep conversation previews in sync
      setConversations((prev) =>
        prev.map((c) =>
          c.roomId === msg.roomId
            ? {
                ...c,
                lastPreview: msg.content,
                lastSender: msg.sender,
                lastMessageAt: msg.createdAt,
              }
            : c
        )
      );
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  // Join the active room on the socket whenever it changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeRoomId) return;
    socket.emit("join", activeRoomId);
  }, [activeRoomId]);

  // Load history for the active room via HTTP
  useEffect(() => {
    if (!token || !activeRoomId) {
      setMessages([]);
      return;
    }
    let cancelled = false;

    async function loadMessages() {
      setLoadingMessages(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_URL}/messages?roomId=${encodeURIComponent(activeRoomId)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Message[];
        if (!cancelled) setMessages(data);
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || "Failed to load messages");
        }
      } finally {
        if (!cancelled) {
          setLoadingMessages(false);
        }
      }
    }

    loadMessages();
    return () => {
      cancelled = true;
    };
  }, [token, activeRoomId]);

  // Auto-scroll to the last message when messages or activeRoomId change
  useEffect(() => {
    if (!messagesEndRef.current) return;
    const id = window.setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 50);
    return () => window.clearTimeout(id);
  }, [activeRoomId, messages]);

  // Helper to insert or surround text at cursor in textarea
  const insertAtCursor = (snippet: string, surround = false) => {
    if (textareaRef.current) {
      const el = textareaRef.current;
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;
      let newValue = input;
      let newCursorPos = start;
      if (surround && start !== end) {
        // Surround selected text
        newValue =
          input.slice(0, start) +
          snippet +
          input.slice(start, end) +
          snippet +
          input.slice(end);
        newCursorPos = end + snippet.length * 2;
      } else if (surround) {
        // Insert double snippet at cursor, place cursor in between
        newValue =
          input.slice(0, start) + snippet + snippet + input.slice(end);
        newCursorPos = start + snippet.length;
      } else {
        // Insert snippet at cursor
        newValue =
          input.slice(0, start) + snippet + input.slice(end);
        newCursorPos = start + snippet.length;
      }
      setInput(newValue);
      window.requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          // Set selection
          if (surround && start !== end) {
            textareaRef.current.selectionStart = start + snippet.length;
            textareaRef.current.selectionEnd = end + snippet.length;
          } else {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newCursorPos;
          }
        }
      });
    } else {
      // Fallback: update input globally
      let newValue = input;
      if (surround && input.length > 0) {
        newValue = snippet + input + snippet;
      } else {
        newValue = input + snippet;
      }
      setInput(newValue);
    }
  };

  const handleSend = async () => {
    if (!token || !activeRoomId || !input.trim()) return;
    const content = input.trim();
    setInput("");

    const socket = socketRef.current;

    // Prefer real-time via Socket.io
    if (socket && socket.connected) {
      try {
        socket.emit("send_message", {
          roomId: activeRoomId,
          content,
          sender: "Agent",
        });
      } catch (e) {
        console.error("Socket send failed, falling back to HTTP", e);
        // fallback to HTTP if emit fails
        try {
          const res = await fetch(`${API_URL}/messages`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              roomId: activeRoomId,
              content,
              sender: "Agent",
            }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const msg = (await res.json()) as Message;
          setMessages((prev) => [...prev, msg]);
        } catch (err) {
          console.error("Failed to send via HTTP", err);
          setError("Failed to send message");
        }
      }
      return;
    }

    // If no socket, keep previous HTTP behavior
    try {
      const res = await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomId: activeRoomId,
          content,
          sender: "Agent",
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const msg = (await res.json()) as Message;
      setMessages((prev) => [...prev, msg]);
    } catch (e) {
      console.error("Failed to send", e);
      setError("Failed to send message");
    }
  };


  const handleConversationContextMenu = (
    event: MouseEvent<HTMLButtonElement>,
    conversationId: string
  ) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      conversationId,
    });
  };

  const handleMoveToInbox = async (inboxId: string | null) => {
    if (!token || !contextMenu) return;
    try {
      const res = await fetch(
        `${API_URL}/conversations/${encodeURIComponent(
          contextMenu.conversationId
        )}/inbox`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ inboxId }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === contextMenu.conversationId ? { ...c, inboxId } : c
        )
      );
    } catch (e) {
      console.error("Failed to move conversation", e);
    } finally {
      setContextMenu(null);
    }
  };

    const handleAssignConversation = async (assigneeId: string | null) => {
    if (!token || !contextMenu) return;
    try {
      const res = await fetch(
        `${API_URL}/conversations/${encodeURIComponent(
          contextMenu.conversationId
        )}/assign`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ assigneeId }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === contextMenu.conversationId
            ? {
                ...c,
                assigneeId,
              }
            : c
        )
      );
    } catch (e) {
      console.error("Failed to assign conversation", e);
    }
  };

  const handleUpdateStatus = async (
    status: "OPEN" | "PENDING" | "RESOLVED"
  ) => {
    if (!token || !contextMenu) return;
    try {
      const res = await fetch(
        `${API_URL}/conversations/${encodeURIComponent(
          contextMenu.conversationId
        )}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === contextMenu.conversationId
            ? {
                ...c,
                status,
              }
            : c
        )
      );
    } catch (e) {
      console.error("Failed to update conversation status", e);
    } finally {
      setContextMenu(null);
    }
  };

  const filteredConversations = activeInboxId
    ? conversations.filter((c) => c.inboxId === activeInboxId)
    : conversations;

  const currentInboxId =
    contextMenu &&
    conversations.find((c) => c.id === contextMenu.conversationId)?.inboxId
      ? conversations.find((c) => c.id === contextMenu.conversationId)!
          .inboxId
      : null;

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px minmax(0, 2fr)",
          gap: 12,
          height: "100%",
          minHeight: 0,
          fontSize: 13,
          color: "var(--text-primary)",
        }}
      >

        {/* MIDDLE COLUMN: Conversations list */}
        <div
          style={{
            borderRadius: 16,
            border: "1px solid var(--border-color)",
            background: "var(--bg-panel)",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 12,
            }}
          >
            <span>Live Inbox</span>
            <span
              style={{
                fontSize: 11,
                color: "var(--text-secondary)",
              }}
            >
              {team?.name ?? "Workspace"}
            </span>
          </div>

          {/* Search bar */}
          <div
            style={{
              padding: 8,
              borderTop: "1px solid var(--border-color)",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <input
              placeholder="Search conversations…"
              style={{
                width: "100%",
                borderRadius: 8,
                border: "1px solid var(--border-color)",
                padding: "6px 8px",
                fontSize: 12,
                background: "var(--bg-subpanel)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
            }}
          >
            {loadingConvos && (
              <div
                style={{
                  padding: 12,
                  fontSize: 12,
                  color: "var(--text-secondary)",
                }}
              >
                Loading conversations…
              </div>
            )}

            {/* Global empty state when there are no conversations at all */}
            {!loadingConvos && conversations.length === 0 && !activeInboxId && (
              <div
                style={{
                  padding: 12,
                  fontSize: 12,
                  color: "var(--text-secondary)",
                }}
              >
                No conversations yet. New visitors will appear here.
              </div>
            )}

            {/* Empty state for a sub-inbox with no conversations */}
            {!loadingConvos &&
              conversations.length > 0 &&
              activeInboxId &&
              filteredConversations.length === 0 && (
                <div
                  style={{
                    padding: 12,
                    fontSize: 12,
                    color: "var(--text-secondary)",
                  }}
                >
                  No conversations in this inbox yet.
                  <br />
                  Move a conversation here using the right-click menu.
                </div>
              )}

            {filteredConversations.map((c) => {
              const active = c.roomId === activeRoomId;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveRoomId(c.roomId)}
                  onContextMenu={(e) =>
                    handleConversationContextMenu(e, c.id)
                  }
                  style={{
                    width: "100%",
                    border: "none",
                    borderRadius: 10,
                    padding: "8px 10px",
                    textAlign: "left",
                    cursor: "pointer",
                    background: active
                      ? "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(22,163,74,0.16))"
                      : "transparent",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    color: "var(--text-primary)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 12,
                    }}
                  >
                    <span>Visitor {c.roomId.slice(-5)}</span>
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--text-secondary)",
                      }}
                    >
                      {new Date(c.lastMessageAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {c.lastPreview || "No messages yet"}
                  </div>
                                    <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--text-secondary)",
                      }}
                    >
                      {c.assigneeId
                        ? c.assigneeId === currentUserId
                          ? "Assigned to you"
                          : c.assigneeName
                          ? `Assigned to ${c.assigneeName}`
                          : "Assigned"
                        : "Unassigned"}
                    </span>
                    {c.status && (
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 6px",
                          borderRadius: 999,
                          border: "1px solid var(--border-color)",
                          textTransform: "uppercase",
                          letterSpacing: 0.06,
                          color:
                            c.status === "RESOLVED"
                              ? "#16a34a"
                              : c.status === "PENDING"
                              ? "#fbbf24"
                              : "#22c55e",
                        }}
                      >
                        {c.status.toLowerCase()}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Chat panel */}
        <div
          style={{
            borderRadius: 16,
            border: "1px solid var(--border-color)",
            background: "var(--bg-panel)",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid var(--border-color)",
              fontSize: 12,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>
              {activeRoomId ? `Room ${activeRoomId.slice(-8)}` : "No conversation"}
            </span>
            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
              Live chat
            </span>
          </div>
          <div
            ref={messagesContainerRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "10px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {loadingMessages && (
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Loading messages…
              </div>
            )}
            {messages.map((m) => {
              const mine = m.sender === "Agent";
              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    justifyContent: mine ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "62%",
                      padding: "8px 12px",
                      borderRadius: 18,
                      borderBottomLeftRadius: mine ? 18 : 6,
                      borderBottomRightRadius: mine ? 6 : 18,
                      fontSize: 13,
                      lineHeight: 1.4,
                      background: mine
                        ? "linear-gradient(135deg, #22c55e, #16a34a)"
                        : "#020617",
                      color: mine ? "#022c22" : "#e5e7eb",
                      boxShadow: "0 10px 30px rgba(15,23,42,0.35)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        opacity: 0.7,
                        marginBottom: 2,
                      }}
                    >
                      {mine ? "Agent" : m.sender || "Visitor"}
                    </div>
                    <div>{m.content}</div>
                  </div>
                </div>
              );
            })}
            {messages.length === 0 && !loadingMessages && (
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Select a conversation to start chatting.
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div
            style={{
              borderTop: "1px solid var(--border-color)",
              padding: "8px 10px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                type="button"
                onClick={() => insertAtCursor("😊")}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-subpanel)",
                  fontSize: 14,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                }}
                tabIndex={-1}
              >
                😊
              </button>
              <button
                type="button"
                onClick={() => insertAtCursor("**", true)}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-subpanel)",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                }}
                tabIndex={-1}
              >
                B
              </button>
              <button
                type="button"
                onClick={() => insertAtCursor("_", true)}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-subpanel)",
                  fontSize: 14,
                  fontStyle: "italic",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                }}
                tabIndex={-1}
              >
                i
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSend();
              }}
              style={{ display: "flex", alignItems: "flex-end", gap: 8 }}
            >
              <textarea
                ref={textareaRef}
                placeholder={
                  activeRoomId ? "Reply to visitor…" : "Select a conversation…"
                }
                disabled={!activeRoomId}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                rows={2}
                style={{
                  flex: 1,
                  borderRadius: 12,
                  border: "1px solid var(--border-color)",
                  padding: "8px 10px",
                  fontSize: 12,
                  resize: "none",
                  background: "var(--bg-subpanel)",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={!activeRoomId || !input.trim()}
                style={{
                  borderRadius: 999,
                  border: "none",
                  padding: "8px 14px",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor:
                    !activeRoomId || !input.trim() ? "not-allowed" : "pointer",
                  background:
                    !activeRoomId || !input.trim() ? "#4b5563" : "#22c55e",
                  color: "#022c22",
                  transition:
                    "background 120ms ease-out, transform 80ms ease-out",
                }}
              >
                Send
              </button>
            </form>
          </div>
          {error && (
            <div
              style={{
                padding: "4px 10px 8px",
                fontSize: 11,
                color: "#f97373",
              }}
            >
              {error}
            </div>
          )}
        </div>
      </div>

      {contextMenu && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
          }}
          onClick={() => setContextMenu(null)}
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
                  onClick={() => handleMoveToInbox(inbox.id)}
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
              onClick={() => handleMoveToInbox(null)}
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
                void handleAssignConversation(currentUserId);
                setContextMenu(null);
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
                void handleAssignConversation(null);
                setContextMenu(null);
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
              onClick={() => handleUpdateStatus("OPEN")}
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
              onClick={() => handleUpdateStatus("PENDING")}
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
              onClick={() => handleUpdateStatus("RESOLVED")}
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
          </div>
        </div>
      )}
    </>
  );
}