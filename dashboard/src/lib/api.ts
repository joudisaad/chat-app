// src/lib/api.ts
import type {
  Conversation,
  Message,
  Team,
  WidgetSettings,
  AuthResponse,
} from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data?.message) msg = data.message;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

/**
 * 🔐 Login (used by AgentDashboard and auth flow)
 */
export async function loginRequest(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handle<AuthResponse>(res);
}

/**
 * 👤 Get current user/team from token
 */
// src/lib/api.ts

// ... existing imports + code ...

export async function fetchMe(token: string) {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handle<{ user: { id: string; email: string; name: string }; team: Team }>(
    res
  );
}

// ✅ Add this alias so AgentDashboard can still use meRequest
export const meRequest = fetchMe;

// ... rest of your functions (fetchConversations, fetchMessages, etc.) ...

/**
 * 💬 List conversations for current team
 */
export async function fetchConversations(
  token: string
): Promise<Conversation[]> {
  const res = await fetch(`${API_URL}/conversations`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handle<Conversation[]>(res);
}

/**
 * 📄 Load messages of a conversation
 */
export async function fetchMessages(
  token: string,
  roomId: string
): Promise<Message[]> {
  const res = await fetch(
    `${API_URL}/messages?roomId=${encodeURIComponent(roomId)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return handle<Message[]>(res);
}

/**
 * 📤 Send a message in a room
 */
export async function sendMessage(
  token: string,
  roomId: string,
  content: string,
  sender: string
): Promise<Message> {
  const res = await fetch(`${API_URL}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ roomId, content, sender }),
  });
  return handle<Message>(res);
}

/**
 * ⚙️ Widget settings
 */
export async function fetchWidgetSettings(
  token: string
): Promise<WidgetSettings | null> {
  const res = await fetch(`${API_URL}/settings/widget`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 404) {
    // no settings yet
    return null;
  }

  return handle<WidgetSettings>(res);
}

export async function updateWidgetSettings(
  token: string,
  payload: Partial<WidgetSettings>
): Promise<WidgetSettings> {
  const res = await fetch(`${API_URL}/settings/widget`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handle<WidgetSettings>(res);
}