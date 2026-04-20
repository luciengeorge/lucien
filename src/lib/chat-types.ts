export interface PersistedChatMessage {
  createdAt: number;
  id: string;
  modelId?: string;
  parts: Array<{ type: string } & Record<string, {}>>;
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
  } | null;
  messages: PersistedChatMessage[];
}
