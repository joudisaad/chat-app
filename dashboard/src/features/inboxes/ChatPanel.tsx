import type { Message } from "../../AgentDashboard";
import type { RefObject } from "react";
import type { Theme } from "../../App";

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
  theme: Theme;
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
  theme,
}: ChatPanelProps) {
  const hasConversation = Boolean(activeRoomId);
  const isDark = theme === "dark"; // still here if you want it later

  const formatDateLabel = (date: Date) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    if (isSameDay(date, today)) return "Today";
    if (isSameDay(date, yesterday)) return "Yesterday";

    return date.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
    });
  };

  const formatTimeLabel = (date: Date) =>
    date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className={
        // full-height column, colors driven by CSS variables
        "flex h-full min-h-0 max-h-full w-full flex-col overflow-hidden panel"
      }
    >
      {/* HEADER */}
      <div className="flex items-baseline justify-between border-b border-[color:var(--border-color)] px-4 py-2 text-sm">
        <div className="flex flex-col">
          <span className="font-medium text-[color:var(--text-primary)]">
            {hasConversation ? `Room ${activeRoomId!.slice(-8)}` : "No conversation"}
          </span>
          <span className="text-[11px] text-[color:var(--text-secondary)]">
            Live chat
          </span>
        </div>
      </div>

      {/* MESSAGES (scrollable area only) */}
      <div
        ref={messagesContainerRef}
        className="flex-1 min-h-0 max-h-full overflow-y-auto px-4 py-3 space-y-3"
      >
        {loadingMessages && (
          <div className="text-xs text-[color:var(--text-secondary)]">
            Loading messages…
          </div>
        )}

        {(() => {
          let lastDateKey: string | null = null;

          return messages.map((m) => {
            const mine = m.sender === "Agent";
            const createdAtRaw = (m as any).createdAt;
            const createdAt = createdAtRaw ? new Date(createdAtRaw) : null;
            const dateKey = createdAt ? createdAt.toDateString() : null;
            const showDateDivider = dateKey !== null && dateKey !== lastDateKey;

            if (showDateDivider) {
              lastDateKey = dateKey;
            }

            return (
              <div key={m.id}>
                {showDateDivider && createdAt && (
                  <div className="mb-2 flex justify-center">
                    <span className="rounded-full bg-[color:var(--bg-subpanel)] px-3 py-0.5 text-[11px] text-[color:var(--text-secondary)]">
                      {formatDateLabel(createdAt)}
                    </span>
                  </div>
                )}

                <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[62%] rounded-2xl px-3 py-2 text-sm shadow-lg ${
                      mine
                        ? "bubble-agent rounded-br-md"
                        : "bubble-visitor rounded-bl-md"
                    }`}
                  >
                    <div className="mb-0.5 text-[10px] opacity-70">
                      {mine ? "Agent" : m.sender || "Visitor"}
                    </div>
                    <div className="whitespace-pre-wrap break-words">
                      {m.content}
                    </div>
                    {createdAt && (
                      <div className="mt-1 flex justify-end text-[10px] text-[color:var(--text-secondary)] opacity-70">
                        {formatTimeLabel(createdAt)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          });
        })()}

        {messages.length === 0 && !loadingMessages && (
          <div className="text-xs text-[color:var(--text-secondary)]">
            Select a conversation to start chatting.
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* COMPOSER */}
      <div className="border-t border-[color:var(--border-color)] p-3 subpanel">
        <div className="mb-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => insertAtCursor("😊")}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--border-color)] bg-[color:var(--bg-main)] text-sm text-[color:var(--text-primary)] transition-colors hover:brightness-110"
            tabIndex={-1}
          >
            😊
          </button>
          <button
            type="button"
            onClick={() => insertAtCursor("**", true)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--border-color)] bg-[color:var(--bg-main)] text-xs font-bold text-[color:var(--text-primary)] transition-colors hover:brightness-110"
            tabIndex={-1}
          >
            B
          </button>
          <button
            type="button"
            onClick={() => insertAtCursor("_", true)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--border-color)] bg-[color:var(--bg-main)] text-sm italic text-[color:var(--text-primary)] transition-colors hover:brightness-110"
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
          className="flex items-end gap-2"
        >
          <textarea
            ref={textareaRef}
            placeholder={
              hasConversation ? "Reply to visitor…" : "Select a conversation…"
            }
            disabled={!hasConversation}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            rows={2}
            className="flex-1 resize-none rounded-lg border border-[color:var(--border-color)] bg-[color:var(--bg-main)] p-2 text-sm text-[color:var(--text-primary)] outline-none transition-colors placeholder:text-[color:var(--text-secondary)] focus:border-emerald-400"
          />
          <button
            type="submit"
            disabled={!hasConversation || !input.trim()}
            className={`rounded-full px-4 py-2 text-sm font-medium text-white transition-colors ${
              !hasConversation || !input.trim()
                ? "cursor-not-allowed bg-slate-500"
                : "cursor-pointer bg-emerald-500 hover:bg-emerald-600"
            }`}
          >
            Send
          </button>
        </form>
      </div>

      {error && (
        <div className="px-4 pb-2 text-xs text-red-400">{error}</div>
      )}
    </div>
  );
}