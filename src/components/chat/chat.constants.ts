/** Short chip labels so all four fit in two rows on a phone; the full question is what gets sent. */
export const STARTER_PROMPTS = [
  { label: "What's he building at Fyxer?", prompt: "What is Lucien building at Fyxer right now?" },
  { label: "His best projects", prompt: "Which projects best show how Lucien thinks?" },
  { label: "What kind of engineer is he?", prompt: "What kind of product engineer is Lucien?" },
  { label: "His resume", prompt: "Can I see Lucien's resume?" },
] as const;

/** Labels shown in the tool-call-in-progress chip, keyed by tool name. */
export const TOOL_PROGRESS_LABELS = {
  contact_lucien: "Sending your message…",
  download_resume: "Getting Lucien's resume…",
  link_work_entry: "Finding the right work…",
} as const;
