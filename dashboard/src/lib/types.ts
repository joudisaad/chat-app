// src/lib/types.ts
export type Theme = "light" | "dark";

export interface Team {
  id: string;
  name: string;
  publicKey?: string;
}

export interface Conversation {
  id: string;
  roomId: string;
  lastMessageAt: string;
  lastPreview: string | null;
  lastSender: string | null;
  teamId: string;
}

export interface Message {
  id: string;
  roomId: string;
  content: string;
  sender: string;
  createdAt: string;
}

export interface WidgetSettings {
  id: string;
  teamId: string;
  launcherLabel: string;
  launcherColor: string;
  textColor: string;
  position: "bottom-right" | "bottom-left";
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: { id: string; email: string; name: string };
  team: Team;
}