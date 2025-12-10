// src/AgentDashboard.tsx
import {
  useCallback,
  useEffect,
  useState,
  useRef,
  type MouseEvent,
} from "react";
import { io, type Socket } from "socket.io-client";
import type { Team, Theme } from "./App";
import "./AgentDashboard.css";
import { ConversationList } from "./features/inboxes/ConversationList";
import { ChatPanel } from "./features/inboxes/ChatPanel";
import { ConversationContextMenu } from "./features/inboxes/ConversationContextMenu";
export interface Conversation {
  id: string;
  roomId: string;
  lastMessageAt: string;
  lastPreview: string | null;
  lastSender: string | null;
  inboxId?: string | null;
  status?: "OPEN" | "PENDING" | "RESOLVED";
  assigneeId?: string | null;
  assigneeName?: string | null;
  etiquettes?: { id: string; name: string; color: string; slug?: string }[];
  // optional primary label name for backwards-compat display
  etiquette?: string | null;
}

export interface Message {
  id: string;
  roomId: string;
  content: string;
  sender: string;
  createdAt: string;
}

export interface Inbox {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface Etiquette {
  id: string;
  name: string;
  color: string;
  slug?: string;
  description?: string | null;
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
  theme: Theme;
}

export default function AgentDashboard({
  team,
  activeInboxId,
  theme,
}: AgentDashboardProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loadingConvos, setLoadingConvos] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inboxes, setInboxes] = useState<Inbox[]>([]);
  const [etiquettes, setEtiquettes] = useState<Etiquette[]>([]);
  const [selectedEtiquette, setSelectedEtiquette] = useState<string | null>(null);

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
          const withPrimaryEtiquette = data.map((c) => ({
            ...c,
            etiquette:
              c.etiquettes && c.etiquettes.length > 0
                ? c.etiquettes[0].name
                : null,
          }));
          setConversations(withPrimaryEtiquette);
          if (!activeRoomId && withPrimaryEtiquette.length > 0) {
            setActiveRoomId(withPrimaryEtiquette[0].roomId);
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

  const loadEtiquettes = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/etiquettes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Etiquette[];
      setEtiquettes(data);
    } catch (e) {
      console.error("Failed to load etiquettes", e);
    }
  }, [token]);

  // Load inboxes once we have a token
  useEffect(() => {
    void loadInboxes();
  }, [loadInboxes]);

  useEffect(() => {
    void loadEtiquettes();
  }, [loadEtiquettes]);

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


  const handleCreateEtiquette = async (data: { name: string; color: string }) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/etiquettes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: data.name,
          color: data.color,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = (await res.json()) as Etiquette;
      setEtiquettes((prev) => [...prev, created]);
    } catch (e) {
      console.error("Failed to create etiquette", e);
    }
  };

  const handleDeleteEtiquette = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/etiquettes/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("Failed to delete etiquette", await res.text());
        return;
      }

      // Remove from local state
      setEtiquettes((prev) => prev.filter((tag) => tag.id !== id));

      // If the deleted etiquette was currently selected, clear the filter
      setSelectedEtiquette((current) => {
        const deleted = etiquettes.find((t) => t.id === id);
        if (deleted && deleted.slug && deleted.slug === current) {
          return null;
        }
        return current;
      });
    } catch (e) {
      console.error("Error deleting etiquette", e);
    }
  };

  const handleApplyEtiquetteToConversation = async (
    conversationId: string,
    etiquetteId: string
  ) => {
    if (!token) return;

    // Find the conversation and etiquette objects so we can decide
    // whether this should ADD or REMOVE the label (toggle behavior).
    const conversation = conversations.find((c) => c.id === conversationId);
    const tag = etiquettes.find((t) => t.id === etiquetteId);

    if (!conversation || !tag) {
      console.warn("Conversation or etiquette not found for toggle", {
        conversationId,
        etiquetteId,
      });
      return;
    }

    const alreadyHas = (conversation.etiquettes || []).some(
      (e) => e.id === etiquetteId
    );

    const method = alreadyHas ? "DELETE" : "POST";

    try {
      const res = await fetch(
        `${API_URL}/conversations/${encodeURIComponent(
          conversationId
        )}/etiquettes/${encodeURIComponent(etiquetteId)}`,
        {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        console.error(
          `Failed to ${alreadyHas ? "remove" : "apply"} etiquette to conversation`,
          await res.text()
        );
        return;
      }

      // Update local state so the label list is in sync immediately
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== conversationId) return c;

          const existing = c.etiquettes || [];
          let updatedEtiquettes;

          if (alreadyHas) {
            // Remove the etiquette
            updatedEtiquettes = existing.filter((e) => e.id !== etiquetteId);
          } else {
            // Add (or replace) the etiquette
            const withoutCurrent = existing.filter((e) => e.id !== tag.id);
            updatedEtiquettes = [...withoutCurrent, tag];
          }

          return {
            ...c,
            etiquettes: updatedEtiquettes,
            etiquette: updatedEtiquettes[0]?.name ?? null,
          };
        })
      );
    } catch (e) {
      console.error("Error toggling etiquette on conversation", e);
    } finally {
      setContextMenu(null);
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

  const filteredConversations = conversations.filter((c) => {
    const matchesInbox = activeInboxId ? c.inboxId === activeInboxId : true;
    const matchesEtiquette = selectedEtiquette
      ? (c.etiquettes || []).some((tag) => tag.slug === selectedEtiquette)
      : true;
    return matchesInbox && matchesEtiquette;
  });

  const currentInboxId =
    contextMenu &&
    conversations.find((c) => c.id === contextMenu.conversationId)?.inboxId
      ? conversations.find((c) => c.id === contextMenu.conversationId)!
          .inboxId
      : null;

  const selectedConversation = conversations.find(
    (c) => c.id === contextMenu?.conversationId
  );

  return (
    <>
      <div className="flex h-full min-h-0 w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
        {/* LEFT: Conversation list, fixed width */}
        <div className="flex h-full w-80 flex-none flex-col border-r border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/40">
          <ConversationList
            team={team}
            conversations={conversations}
            filteredConversations={filteredConversations}
            loadingConvos={loadingConvos}
            activeInboxId={activeInboxId}
            activeRoomId={activeRoomId}
            currentUserId={currentUserId}
            etiquettes={etiquettes}
            onCreateEtiquette={handleCreateEtiquette}
            onDeleteEtiquette={handleDeleteEtiquette}
            selectedEtiquette={selectedEtiquette}
            setSelectedEtiquette={setSelectedEtiquette}
            onSelectRoom={setActiveRoomId}
            onContextMenu={handleConversationContextMenu}
          />
        </div>

        {/* RIGHT: Chat panel, takes all remaining width */}
        <div className="flex min-w-0 flex-1 flex-col">
          <ChatPanel
            theme={theme}
            activeRoomId={activeRoomId}
            messages={messages}
            loadingMessages={loadingMessages}
            input={input}
            setInput={setInput}
            onSend={handleSend}
            insertAtCursor={insertAtCursor}
            messagesContainerRef={messagesContainerRef}
            messagesEndRef={messagesEndRef}
            textareaRef={textareaRef}
            error={error}
          />
        </div>
      </div>

      <ConversationContextMenu
        contextMenu={contextMenu}
        inboxes={inboxes}
        currentInboxId={currentInboxId}
        currentUserId={currentUserId}
        etiquettes={etiquettes}
        conversationEtiquettes={selectedConversation?.etiquettes ?? []}
        onClose={() => setContextMenu(null)}
        onMoveToInbox={handleMoveToInbox}
        onAssign={handleAssignConversation}
        onUpdateStatus={handleUpdateStatus}
        onApplyEtiquette={handleApplyEtiquetteToConversation}
      />
    </>
  );
}