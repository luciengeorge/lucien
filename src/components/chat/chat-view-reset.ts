interface ConversationRef {
  id: string;
}

/**
 * Whether a conversation change should tear down and rebuild the chat view.
 *
 * `ChatConversation` is keyed so that starting a new conversation drops the
 * old `useChat` state cleanly. But the homepage document is edge-cached with
 * no conversation at all and creates one on mount, and keying on the
 * conversation id made that first arrival look identical to a deliberate
 * reset. The tree remounted and every scroll-triggered entry animation played
 * a second time.
 *
 * Only a swap between two different conversations is a real reset.
 */
export function shouldResetConversationView(previous: ConversationRef | null, next: ConversationRef | null): boolean {
  if (previous === null || next === null) return false;
  return previous.id !== next.id;
}
