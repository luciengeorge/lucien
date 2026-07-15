export const STARTER_PROMPTS = [
  "What is Lucien building at Fyxer right now?",
  "Which projects best show how Lucien thinks?",
  "What kind of product engineer is Lucien?",
  "Can I see Lucien's resume?",
] as const;

/** Labels shown in the tool-call-in-progress chip, keyed by tool name. */
export const TOOL_PROGRESS_LABELS = {
  contact_lucien: "Sending your message…",
  download_resume: "Getting Lucien's resume…",
  link_work_entry: "Finding the right work…",
} as const;
