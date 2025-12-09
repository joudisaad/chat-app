// src/AgentDashboard.tsx
import { useEffect, useState } from "react";
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

  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("CHATAPP_TOKEN")
      : null;

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
        if (!cancelled) setError(e.message || "Failed to load conversations");
      } finally {
        if (!cancelled) setLoadingConvos(false);
      }
    }

    loadConversations();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
        if (!cancelled) setError(e.message || "Failed to load messages");
      } finally {
        if (!cancelled) setLoadingMessages(false);
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

  const isDark =
    typeof document !== "undefined"
      ? document.documentElement.dataset.theme === "dark"
      : true;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "280px minmax(0, 2fr)",
        gap: 12,
        height: "100%",
        minHeight: 0,
        fontSize: 13,
      }}
    >
      {/* Conversations list */}
      <div
        style={{
          borderRadius: 16,
          border: isDark ? "1px solid #111827" : "1px solid #e5e7eb",
          background: isDark ? "#020617" : "#ffffff",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <div
          style={{
            padding: "10px 12px",
            borderBottom: isDark ? "1px solid #111827" : "1px solid #e5e7eb",
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
              color: "#9ca3af",
            }}
          >
            {team?.name ?? "Workspace"}
          </span>
        </div>
        <div
          style={{
            padding: 8,
            borderBottom: isDark ? "1px solid #111827" : "1px solid #e5e7eb",
          }}
        >
          <input
            placeholder="Search conversations…"
            style={{
              width: "100%",
              borderRadius: 8,
              border: isDark ? "1px solid #1f2937" : "1px solid #d1d5db",
              padding: "6px 8px",
              fontSize: 12,
              background: isDark ? "#020617" : "#ffffff",
              color: isDark ? "#e5e7eb" : "#111827",
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
                color: "#9ca3af",
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
                color: "#9ca3af",
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
                  color: active ? "#e5e7eb" : "#d1d5db",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
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
                      color: "#9ca3af",
                    }}
                  >
                    {new Date(c.lastMessageAt).toLocaleTimeString()}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
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
          border: isDark ? "1px solid #111827" : "1px solid #e5e7eb",
          background: isDark ? "#020617" : "#ffffff",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <div
          style={{
            padding: "10px 12px",
            borderBottom: isDark ? "1px solid #111827" : "1px solid #e5e7eb",
            fontSize: 12,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>
            {activeRoomId ? `Room ${activeRoomId.slice(-8)}` : "No conversation"}
          </span>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>Live chat</span>
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
            <div style={{ fontSize: 12, color: "#9ca3af" }}>
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
            <div style={{ fontSize: 12, color: "#9ca3af" }}>
              Select a conversation to start chatting.
            </div>
          )}
        </div>
        <div
          style={{
            borderTop: isDark ? "1px solid #111827" : "1px solid #e5e7eb",
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
              border: isDark ? "1px solid #1f2937" : "1px solid #d1d5db",
              padding: "6px 10px",
              fontSize: 12,
              background: isDark ? "#020617" : "#ffffff",
              color: isDark ? "#e5e7eb" : "#111827",
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