import { ChatPage } from "#/components/chat/chat-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: ChatPage });
