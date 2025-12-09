// src/AgentDashboard.tsx
import { useEffect, useState, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import type { Team } from "./App";

interface Conversation {
  id: string;
  roomId: string;
  lastMessageAt: string;
  lastPreview: string | null;
  lastSender: string | null;
}

interface Message {
  id: string;
  roomId: string;
  content: string;
  sender: string;
  createdAt: string;
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

interface AgentDashboardProps {
  team: Team | null;
}

export default function AgentDashboard({ team }: AgentDashboardProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loadingConvos, setLoadingConvos] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Socket.io client for real-time updates
  const socketRef = useRef<Socket | null>(null);
  const activeRoomRef = useRef<string | null>(null);

  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("CHATAPP_TOKEN")
      : null;

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

  return (
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
      {/* Conversations list */}
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
          <span>Inbox</span>
          <span
            style={{
              fontSize: 11,
              color: "var(--text-secondary)",
            }}
          >
            {team?.name ?? "Workspace"}
          </span>
        </div>
        <div
          style={{
            padding: 8,
            borderBottom: "1px solid var(--border-color)",
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
          {!loadingConvos && conversations.length === 0 && (
            <div
              style={{
                padding: 12,
                fontSize: 12,
                color: "var(--text-secondary)",
              }}
            >
              No conversations yet.
            </div>
          )}
          {conversations.map((c) => {
            const active = c.roomId === activeRoomId;
            return (
              <button
                key={c.id}
                onClick={() => setActiveRoomId(c.roomId)}
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
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat panel */}
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
                    maxWidth: "70%",
                    borderRadius: 16,
                    padding: "6px 10px",
                    fontSize: 12,
                    background: mine
                      ? "linear-gradient(135deg, #22c55e, #4ade80)"
                      : "#111827",
                    color: mine ? "#022c22" : "#e5e7eb",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      opacity: 0.7,
                      marginBottom: 2,
                    }}
                  >
                    {m.sender}
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
        </div>
        <div
          style={{
            borderTop: "1px solid var(--border-color)",
            padding: "8px 10px",
            display: "flex",
            gap: 8,
          }}
        >
          <input
            placeholder={
              activeRoomId ? "Reply to visitor…" : "Select a conversation…"
            }
            disabled={!activeRoomId}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            style={{
              flex: 1,
              borderRadius: 999,
              border: "1px solid var(--border-color)",
              padding: "6px 10px",
              fontSize: 12,
              background: "var(--bg-subpanel)",
              color: "var(--text-primary)",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!activeRoomId || !input.trim()}
            style={{
              borderRadius: 999,
              border: "none",
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 500,
              cursor:
                !activeRoomId || !input.trim() ? "not-allowed" : "pointer",
              background:
                !activeRoomId || !input.trim() ? "#4b5563" : "#22c55e",
              color: "#022c22",
            }}
          >
            Send
          </button>
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
  );
}