import type {
  Message,
} from "../../AgentDashboard";
import type { RefObject } from "react";

interface ChatPanelProps {
  activeRoomId: string | null;
  messages: Message[];
  loadingMessages: boolean;
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  insertAtCursor: (snippet: string, surround?: boolean) => void;
  messagesContainerRef: RefObject<HTMLDivElement>;
  messagesEndRef: RefObject<HTMLDivElement>;
  textareaRef: RefObject<HTMLTextAreaElement>;
  error: string | null;
}

export function ChatPanel({
  activeRoomId,
  messages,
  loadingMessages,
  input,
  setInput,
  onSend,
  insertAtCursor,
  messagesContainerRef,
  messagesEndRef,
  textareaRef,
  error,
}: ChatPanelProps) {
  return (
    <div className="agent-dashboard-column agent-dashboard-chat">
      <div className="agent-dashboard-header agent-dashboard-chat-header">
        <span>
          {activeRoomId ? `Room ${activeRoomId.slice(-8)}` : "No conversation"}
        </span>
        <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
          Live chat
        </span>
      </div>

      <div ref={messagesContainerRef} className="agent-dashboard-messages">
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

      {/* Composer */}
      <div className="agent-dashboard-composer">
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
            onSend();
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
                onSend();
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
              transition: "background 120ms ease-out, transform 80ms ease-out",
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
  );
}