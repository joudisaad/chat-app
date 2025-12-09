// dashboard/src/AgentDashboard.tsx
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const API_URL = "http://localhost:3000";

interface Message {
  id: string;
  content: string;
  sender: string;
  roomId: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  roomId: string;
  lastSender: string | null;
  lastPreview: string | null;
  lastMessageAt: string;
  createdAt: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface AgentDashboardProps {
  token: string;
  onLogout: () => void;
}

export function AgentDashboard({ token, onLogout }: AgentDashboardProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [input, setInput] = useState("");
  const [sender, setSender] = useState("Agent");
  const [connected, setConnected] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const currentRoomRef = useRef<string | null>(null);

  const theme = isDark
    ? {
        background: "#050816",
        cardBg: "#0b1120",
        border: "#1f2937",
        text: "#f9fafb",
        muted: "#9ca3af",
        accent: "#22c55e",
        bubbleSelf: "#1d4ed8",
        bubbleOther: "rgba(148, 163, 184, 0.13)",
        listBg: "#020617",
        listItemActive: "#111827",
      }
    : {
        background: "#f3f4f6",
        cardBg: "#ffffff",
        border: "#e5e7eb",
        text: "#111827",
        muted: "#6b7280",
        accent: "#16a34a",
        bubbleSelf: "#2563eb",
        bubbleOther: "#e5e7eb",
        listBg: "#f9fafb",
        listItemActive: "#e5e7eb",
      };

  // keep ref in sync
  useEffect(() => {
    currentRoomRef.current = selectedRoomId;
  }, [selectedRoomId]);

  // Socket connection
  useEffect(() => {
    const socket = io(API_URL, {
      transports: ["websocket"],
      // ready for auth later:
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("new_message", (msg: Message) => {
      if (currentRoomRef.current && msg.roomId === currentRoomRef.current) {
        setMessages((prev) => [...prev, msg]);
      }

      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.roomId === msg.roomId);
        const updated: Conversation = {
          id: idx >= 0 ? prev[idx].id : msg.roomId,
          roomId: msg.roomId,
          lastSender: msg.sender,
          lastPreview: msg.content.slice(0, 120),
          lastMessageAt: msg.createdAt,
          createdAt: idx >= 0 ? prev[idx].createdAt : msg.createdAt,
        };
        const rest = prev.filter((c) => c.roomId !== msg.roomId);
        const next = [updated, ...rest];
        return next.sort(
          (a, b) =>
            new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime()
        );
      });
    });

    return () => socket.disconnect();
  }, [token]);

  // Load conversations
  useEffect(() => {
    fetch(`${API_URL}/messages/rooms`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data: Conversation[]) => {
        const sorted = [...data].sort(
          (a, b) =>
            new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime()
        );
        setConversations(sorted);
      })
      .catch((err) => console.error("Conversations load error", err));
  }, [token]);

  const selectConversation = (roomId: string) => {
    if (!socketRef.current) return;

    setSelectedRoomId(roomId);
    setMessages([]);
    socketRef.current.emit("join", roomId);

    fetch(`${API_URL}/messages?roomId=${encodeURIComponent(roomId)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data: Message[]) => setMessages(data))
      .catch((err) => console.error("History error", err));
  };

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current || !selectedRoomId) return;
    socketRef.current.emit("send_message", {
      roomId: selectedRoomId,
      content: input.trim(),
      sender,
    });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.background,
        color: theme.text,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1080,
          height: "80vh",
          background: theme.cardBg,
          borderRadius: 16,
          border: `1px solid ${theme.border}`,
          display: "flex",
          overflow: "hidden",
          boxShadow: theme.background === "#050816"
            ? "0 24px 60px rgba(0,0,0,0.75)"
            : "0 20px 40px rgba(15,23,42,0.18)",
        }}
      >
        {/* LEFT: conversations / top bar */}
        <aside
          style={{
            width: 280,
            borderRight: `1px solid ${theme.border}`,
            display: "flex",
            flexDirection: "column",
            background: theme.listBg,
          }}
        >
          <div
            style={{
              padding: "12px 14px",
              borderBottom: `1px solid ${theme.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 14,
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>Conversations</div>
              <div
                style={{
                  fontSize: 11,
                  color: theme.muted,
                  marginTop: 2,
                }}
              >
                {conversations.length} active
              </div>
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setIsDark((d) => !d)}
                style={{
                  borderRadius: 999,
                  border: `1px solid ${theme.border}`,
                  background: "transparent",
                  color: theme.text,
                  fontSize: 11,
                  padding: "4px 8px",
                  cursor: "pointer",
                }}
              >
                {isDark ? "Light" : "Dark"}
              </button>
              <button
                onClick={onLogout}
                style={{
                  borderRadius: 999,
                  border: `1px solid ${theme.border}`,
                  background: "transparent",
                  color: theme.muted,
                  fontSize: 11,
                  padding: "4px 8px",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "4px 4px 8px",
              fontSize: 12,
            }}
          >
            {conversations.length === 0 && (
              <div
                style={{
                  padding: 12,
                  color: theme.muted,
                  fontSize: 12,
                }}
              >
                No conversations yet.
              </div>
            )}

            {conversations.map((conv) => {
              const active = conv.roomId === selectedRoomId;
              return (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv.roomId)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    background: active ? theme.listItemActive : "transparent",
                    borderRadius: 8,
                    padding: "8px 8px",
                    marginBottom: 4,
                    cursor: "pointer",
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
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 500,
                        fontSize: 12,
                      }}
                    >
                      {conv.lastSender ?? "Visitor"}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: theme.muted,
                      }}
                    >
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: theme.muted,
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                    }}
                  >
                    {conv.lastPreview ?? conv.roomId}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: theme.muted,
                      opacity: 0.8,
                    }}
                  >
                    {conv.roomId}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* RIGHT: current conversation */}
        <section
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <header
            style={{
              padding: "12px 16px",
              borderBottom: `1px solid ${theme.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 14,
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>Agent Panel</div>
              <div
                style={{
                  fontSize: 12,
                  color: theme.muted,
                  marginTop: 2,
                }}
              >
                Room:{" "}
                <code style={{ opacity: 0.9 }}>
                  {selectedRoomId ?? "select a conversation"}
                </code>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
              }}
            >
              <label
                style={{
                  fontSize: 11,
                  color: theme.muted,
                }}
              >
                Agent:
              </label>
              <input
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                style={{
                  background: isDark ? "#020617" : "#f9fafb",
                  borderRadius: 6,
                  border: `1px solid ${theme.border}`,
                  padding: "4px 8px",
                  color: theme.text,
                  fontSize: 12,
                }}
              />

              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginLeft: 12,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "999px",
                    background: connected ? "#22c55e" : "#f97316",
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    color: theme.muted,
                  }}
                >
                  {connected ? "Connected" : "Disconnected"}
                </span>
              </span>
            </div>
          </header>

          <div
            style={{
              flex: 1,
              padding: "10px 16px 12px",
              overflowY: "auto",
              fontSize: 13,
            }}
          >
            {!selectedRoomId && (
              <div
                style={{
                  marginTop: 24,
                  textAlign: "center",
                  color: theme.muted,
                  fontSize: 13,
                }}
              >
                Select a conversation from the left.
              </div>
            )}

            {selectedRoomId && messages.length === 0 && (
              <div
                style={{
                  marginTop: 12,
                  textAlign: "center",
                  color: theme.muted,
                  fontSize: 12,
                }}
              >
                No messages yet in this room.
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  marginBottom: 10,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: m.sender === sender ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "72%",
                    padding: "6px 10px",
                    borderRadius: 12,
                    background:
                      m.sender === sender
                        ? theme.bubbleSelf
                        : theme.bubbleOther,
                    color: m.sender === sender ? "#f9fafb" : theme.text,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      opacity: 0.75,
                      marginBottom: 2,
                    }}
                  >
                    {m.sender}
                  </div>
                  <div>{m.content}</div>
                  <div
                    style={{
                      fontSize: 10,
                      opacity: 0.6,
                      marginTop: 4,
                      textAlign: "right",
                    }}
                  >
                    {formatTime(m.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              padding: "10px 16px",
              borderTop: `1px solid ${theme.border}`,
              display: "flex",
              gap: 8,
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedRoomId ? "Type a reply…" : "Select a conversation first"
              }
              disabled={!selectedRoomId}
              style={{
                flex: 1,
                background: isDark ? "#020617" : "#f9fafb",
                borderRadius: 999,
                border: `1px solid ${theme.border}`,
                padding: "8px 12px",
                color: theme.text,
                fontSize: 13,
                outline: "none",
                opacity: selectedRoomId ? 1 : 0.6,
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!selectedRoomId || !input.trim()}
              style={{
                borderRadius: 999,
                padding: "8px 16px",
                border: "none",
                background:
                  selectedRoomId && input.trim()
                    ? theme.accent
                    : isDark
                    ? "#1f2933"
                    : "#e5e7eb",
                color:
                  selectedRoomId && input.trim() ? "#020617" : theme.muted,
                fontSize: 13,
                fontWeight: 600,
                cursor:
                  selectedRoomId && input.trim() ? "pointer" : "not-allowed",
              }}
            >
              Send
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}