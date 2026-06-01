// Client-safe fallback intro shown instantly while the cached LLM intro streams in.
// Kept in a non-server module so it can be imported by both the SSR intro builder
// and the client-rendered bootstrap fallback.
export const HOMEPAGE_INTRO_FALLBACK =
  "I'm Poof, Lucien George's AI portfolio assistant. I can help you explore Lucien's work, background, projects, and interests. Lucien is a product engineer focused on thoughtful, high-leverage software, currently building at Fyxer and shaped by a mix of startup, product, and engineering experience. Ask me about his current work, past projects, technical taste, or personal background.";
