/** Fills the system prompt's slots. Shared by the chat route and the eval harness so they cannot drift. */
export function renderSystemPrompt(template: string, { context, today }: { context: string; today: Date }): string {
  const date = today.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/London",
    weekday: "long",
    year: "numeric",
  });
  return template.replace("{today}", date).replace("{retrieved_context}", context);
}
