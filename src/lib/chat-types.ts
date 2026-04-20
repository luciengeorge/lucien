export type PersistedChatMessagePart = Record<string, {}>;

export interface PersistedChatMessage {
  createdAt: number;
  id: string;
  metadata?: Record<string, {}> | null;
  modelId?: string;
  parts: PersistedChatMessagePart[];
  provider?: string;
  role: "assistant" | "system" | "user";
}

export interface ChatConversationState {
  conversation: {
    createdAt: number;
    id: string;
    sessionId?: string;
    title?: string;
    updatedAt: number;
  };
  messages: PersistedChatMessage[];
}
