/** Short chip labels so all four fit in two rows on a phone; the full question is what gets sent. */
export const STARTER_PROMPTS = [
  { label: "What's he building at Fyxer?", prompt: "What is Lucien building at Fyxer right now?" },
  { label: "His best projects", prompt: "Which projects best show how Lucien thinks?" },
  { label: "What kind of engineer is he?", prompt: "What kind of product engineer is Lucien?" },
  { label: "His resume", prompt: "Can I see Lucien's resume?" },
] as const;

/** What Poof says it is doing while a tool runs, keyed by tool name. A work link names its entry when it can. */
export const TOOL_PROGRESS_LABELS = {
  contact_lucien: "Sending your message to Lucien…",
  download_resume: "Getting Lucien's resume…",
  link_work_entry: "Pulling up his work…",
} as const;
