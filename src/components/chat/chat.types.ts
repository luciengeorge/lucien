import { useChat } from "@ai-sdk/react";

type ChatState = ReturnType<typeof useChat>;

export type ChatMessage = ChatState["messages"][number];
export type ChatStatus = ChatState["status"];
