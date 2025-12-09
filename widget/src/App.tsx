import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const API_URL = "http://localhost:3000";
const ROOM_KEY = "chatapp_room_id";
// ⚠️ pour l’instant, on met le teamId en dur (dev) TODO
const TEAM_ID = "55477d08-d071-4c95-b4d0-ecb46c6bf6be"; // remplace par le tien
interface Message {
  id: string;
  content: string;
  sender: string;
  roomId: string;
  createdAt: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [name, setName] = useState("Visitor");
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Create or load a roomId for this visitor
  useEffect(() => {
    let stored = window.localStorage.getItem(ROOM_KEY);
    if (!stored) {
      stored = `room_${crypto.randomUUID()}`;
      window.localStorage.setItem(ROOM_KEY, stored);
    }
    setRoomId(stored);
  }, []);

  // Connect socket + load history once roomId is known
  useEffect(() => {
    if (!roomId) return;

    const socket = io(API_URL, {
      transports: ["websocket"],
      auth: { teamId: TEAM_ID },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join", roomId);
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("new_message", (msg: Message) => {
      if (msg.roomId === roomId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    // history
    fetch(`${API_URL}/messages/public?roomId=${encodeURIComponent(roomId)}`)
      .then((r) => r.json())
      .then((data: Message[]) => setMessages(data))
      .catch((e) => console.error(e));

    return () => socket.disconnect();
  }, [roomId]);

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current || !roomId) return;
    socketRef.current.emit("send_message", {
      roomId,
      content: input.trim(),
      sender: name || "Visitor",
    });
    setInput("");
  };

  return (
    <>
      {/* Floating bubble */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed",
          right: 24,
          bottom: 24,
          width: 56,
          height: 56,
          borderRadius: "999px",
          border: "none",
          background: "#22c55e",
          color: "#020617",
          fontWeight: 700,
          fontSize: 18,
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          cursor: "pointer",
        }}
      >
        💬
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            right: 24,
            bottom: 96,
            width: 360,
            maxHeight: 480,
            background: "#020617",
            color: "white",
            borderRadius: 16,
            border: "1px solid #1f2937",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <header
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid #1f2937",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 13,
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>Chat with us</div>
              <div style={{ opacity: 0.7, fontSize: 11 }}>
                Room: {roomId ?? "…"}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
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
              {connected ? "Online" : "Offline"}
            </div>
          </header>

          <div style={{ padding: "6px 10px", fontSize: 11 }}>
            <label>
              Your name:{" "}
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  background: "#020617",
                  borderRadius: 6,
                  border: "1px solid #1f2937",
                  padding: "4px 6px",
                  color: "white",
                  fontSize: 11,
                }}
              />
            </label>
          </div>

          <div
            style={{
              flex: 1,
              padding: "6px 10px 10px",
              overflowY: "auto",
              fontSize: 12,
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  marginBottom: 6,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: m.sender === name ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "6px 9px",
                    borderRadius: 10,
                    background:
                      m.sender === name
                        ? "#22c55e"
                        : "rgba(148,163,184,0.16)",
                    color: m.sender === name ? "#020617" : "white",
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
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
              style={{
                flex: 1,
                background: "#020617",
                borderRadius: 999,
                border: "1px solid #1f2937",
                padding: "7px 10px",
                color: "white",
                fontSize: 12,
              }}
            />
            <button
              onClick={sendMessage}
              style={{
                borderRadius: 999,
                padding: "7px 12px",
                border: "none",
                background: "#22c55e",
                color: "#020617",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
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