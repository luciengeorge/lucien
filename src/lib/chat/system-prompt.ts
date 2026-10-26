/** The day as the prompt states it, in London. */
export function formatPromptDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/London",
    weekday: "long",
    year: "numeric",
  });
}

/**
 * Fills the system prompt's slots. Shared by the chat route, the eval harness and the voice agent sync so they
 * cannot drift. `today` may be preformatted, e.g. a placeholder the voice agent fills per call.
 */
export function renderSystemPrompt(
  template: string,
  { context, today }: { context: string; today: Date | string },
): string {
  const date = typeof today === "string" ? today : formatPromptDate(today);
  return template.replace("{today}", () => date).replace("{context}", () => context);
}
