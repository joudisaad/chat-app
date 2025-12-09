import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { io, Socket } from "socket.io-client";

const API_URL = "http://localhost:3000";
const ROOM_KEY = "chatapp_room_id";

// for TypeScript, declare global var used in install snippet
declare global {
  interface Window {
    CHATAPP_KEY?: string;
  }
}

interface Message {
  id: string;
  content: string;
  sender: string;
  roomId: string;
  createdAt: string;
}

interface WidgetConfig {
  launcherColor?: string;
  launcherTextColor?: string;
  launcherPosition?: "left" | "right";
  launcherLabel?: string;
}

function App() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // 1) Initialize roomId from localStorage
  useEffect(() => {
    let stored = localStorage.getItem(ROOM_KEY);
    if (!stored) {
      stored = `room_${crypto.randomUUID()}`;
      localStorage.setItem(ROOM_KEY, stored);
    }
    setRoomId(stored);
  }, []);

  // 2) Resolve site key → teamId + widget config
  useEffect(() => {
    const siteKey = window.CHATAPP_KEY || "";

    if (!siteKey) {
      setConfigError("Missing CHATAPP_KEY on window.");
      setLoadingConfig(false);
      return;
    }

    fetch(`${API_URL}/public/site/${encodeURIComponent(siteKey)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Invalid site key");
        return res.json();
      })
      .then(
        (data: {
          teamId: string;
          widget?: WidgetConfig | null;
        }) => {
          setTeamId(data.teamId);
          setWidgetConfig(data.widget ?? null);
          setConfigError(null);
        },
      )
      .catch((err) => {
        console.error("Site key error", err);
        setConfigError("Invalid or unknown site key.");
      })
      .finally(() => {
        setLoadingConfig(false);
      });
  }, []);

  // 3) When we have both roomId + teamId → connect socket + load history
  useEffect(() => {
    if (!roomId || !teamId) return;
    const socket = io(API_URL, {
      transports: ["websocket"],
      auth: { teamId },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", roomId);
    });

    socket.on("new_message", (msg: Message) => {
      if (msg.roomId === roomId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    // load history for this room from public endpoint
    fetch(`${API_URL}/messages/public?roomId=${encodeURIComponent(roomId)}`)
      .then((res) => res.json())
      .then((data: Message[]) => setMessages(data))
      .catch((err) => console.error("History error", err));

    return () => {
      socket.disconnect();
    };
  }, [roomId, teamId]);

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current || !roomId) return;
    socketRef.current.emit("send_message", {
      roomId,
      content: input.trim(),
      sender: "Visitor",
    });
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loadingConfig) {
    return null; // widget stays hidden while loading config
  }

  if (configError) {
    console.error(configError);
    return null; // or show a small error badge in dev
  }

  // derive launcher style from widget config
  const launcherBg = widgetConfig?.launcherColor || "#22c55e";
  const launcherText = widgetConfig?.launcherTextColor || "#020617";
  const launcherPos: "left" | "right" =
    widgetConfig?.launcherPosition === "left" ? "left" : "right";
  const launcherLabel = widgetConfig?.launcherLabel || "Chat";

  return (
    <>
      {/* floating button */}
      <button
        style={{
          position: "fixed",
          [launcherPos]: 24,
          bottom: 24,
          width: 56,
          height: 56,
          borderRadius: "999px",
          border: "none",
          background: launcherBg,
          color: launcherText,
          fontSize: 24,
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
          cursor: "pointer",
          zIndex: 9999,
        }}
        onClick={() => setOpen((o) => !o)}
        aria-label={launcherLabel}
      >
        💬
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            [launcherPos]: 24,
            bottom: 96,
            width: 340,
            height: 420,
            background: "#0b1120",
            borderRadius: 16,
            border: "1px solid #1f2937",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            color: "white",
            fontFamily:
              "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            zIndex: 9999,
          }}
        >
          <header
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid #1f2937",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Chat with us</span>
            <span
              style={{
                fontSize: 10,
                opacity: 0.7,
              }}
            >
              #{roomId?.slice(-6)}
            </span>
          </header>

          <div
            style={{
              flex: 1,
              padding: "8px 10px 10px",
              overflowY: "auto",
              fontSize: 13,
            }}
          >
            {messages.length === 0 && (
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.7,
                  marginTop: 8,
                }}
              >
                Hi 👋 Tell us how we can help you.
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  marginBottom: 8,
                  display: "flex",
                  justifyContent:
                    m.sender === "Visitor" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "75%",
                    padding: "6px 9px",
                    borderRadius: 12,
                    background:
                      m.sender === "Visitor"
                        ? launcherBg
                        : "rgba(148, 163, 184, 0.22)",
                    color: m.sender === "Visitor" ? launcherText : "#e5e7eb",
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
            ))}
          </div>

          <div
            style={{
              padding: "8px 10px",
              borderTop: "1px solid #1f2937",
              display: "flex",
              gap: 6,
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              style={{
                flex: 1,
                background: "#020617",
                borderRadius: 999,
                border: "1px solid #1f2937",
                color: "white",
                padding: "8px 10px",
                fontSize: 13,
                outline: "none",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              style={{
                borderRadius: 999,
                border: "none",
                background: input.trim() ? launcherBg : "#1f2937",
                color: input.trim() ? launcherText : "#64748b",
                padding: "8px 12px",
                fontSize: 13,
                fontWeight: 600,
                cursor: input.trim() ? "pointer" : "not-allowed",
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default App;