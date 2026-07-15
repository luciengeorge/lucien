import { cn } from "#/lib/utils";
import { match } from "ts-pattern";
import { z } from "zod";

import type { ChatMessage, ChatStatus } from "./chat.types";

import { ChatContactCard } from "./chat-contact-card";
import { ChatMarkdown } from "./chat-markdown";
import { ChatResumeCard } from "./chat-resume-card";
import { ChatStatusMarker } from "./chat-status-marker";
import { ChatToolProgressChip } from "./chat-tool-progress-chip";
import { ChatWorkLinkCard } from "./chat-work-link-card";
import { TOOL_PROGRESS_LABELS } from "./chat.constants";

const ResumeToolOutputSchema = z.object({
  filename: z.string(),
  url: z.string(),
});
type ResumeToolOutput = z.infer<typeof ResumeToolOutputSchema>;

function isResumeToolOutput(value: unknown): value is ResumeToolOutput {
  return ResumeToolOutputSchema.safeParse(value).success;
}

const WorkLinkToolOutputSchema = z.object({
  company: z.string(),
  role: z.string(),
  slug: z.string(),
  url: z.string(),
});
type WorkLinkToolOutput = z.infer<typeof WorkLinkToolOutputSchema>;

function isWorkLinkToolOutput(value: unknown): value is WorkLinkToolOutput {
  return WorkLinkToolOutputSchema.safeParse(value).success;
}

const ContactToolOutputSchema = z.object({
  status: z.enum(["failed", "sent"]),
});
type ContactToolOutput = z.infer<typeof ContactToolOutputSchema>;

function isContactToolOutput(value: unknown): value is ContactToolOutput {
  return ContactToolOutputSchema.safeParse(value).success;
}

/** True while a tool call's input is being streamed in or has arrived but hasn't resolved to a result yet. */
function isToolPartPending(part: ChatMessage["parts"][number]): boolean {
  return "state" in part && (part.state === "input-streaming" || part.state === "input-available");
}

/** True when there's anything to show for an assistant message: text, reasoning, or a tool card. */
export function hasRenderableContent({
  hasToolCard,
  reasoningParts,
  textParts,
}: {
  hasToolCard: boolean;
  reasoningParts: unknown[];
  textParts: unknown[];
}): boolean {
  return textParts.length > 0 || reasoningParts.length > 0 || hasToolCard;
}

export function ChatTimelineMessage({ message, status }: { message: ChatMessage; status: ChatStatus }) {
  const role = message.role === "user" ? "user" : "assistant";
  const reasoningParts = message.parts.flatMap((part, index) =>
    match(part)
      .with({ type: "reasoning" }, (reasoningPart) => [
        {
          key: `${message.id}-reasoning-${index}`,
          text: reasoningPart.text,
        },
      ])
      .otherwise(() => []),
  );
  const textParts = message.parts.flatMap((part, index) =>
    match(part)
      .with({ type: "text" }, (textPart) => [
        {
          key: `${message.id}-text-${index}`,
          text: textPart.text,
        },
      ])
      .otherwise(() => []),
  );
  const resumeToolParts = message.parts.flatMap((part, index) => {
    if (part.type !== "tool-download_resume") return [];
    if (!("state" in part) || part.state !== "output-available") return [];
    if (!("output" in part) || !isResumeToolOutput(part.output)) return [];
    return [
      {
        filename: part.output.filename,
        key: `${message.id}-resume-${index}`,
        url: part.output.url,
      },
    ];
  });
  const workLinkToolParts = message.parts.flatMap((part, index) => {
    if (part.type !== "tool-link_work_entry") return [];
    if (!("state" in part) || part.state !== "output-available") return [];
    if (!("output" in part) || !isWorkLinkToolOutput(part.output)) return [];
    return [
      {
        company: part.output.company,
        key: `${message.id}-work-link-${index}`,
        role: part.output.role,
        url: part.output.url,
      },
    ];
  });
  const contactToolParts = message.parts.flatMap((part, index) => {
    if (part.type !== "tool-contact_lucien") return [];
    if (!("state" in part) || part.state !== "output-available") return [];
    if (!("output" in part) || !isContactToolOutput(part.output)) return [];
    return [
      {
        key: `${message.id}-contact-${index}`,
        status: part.output.status,
      },
    ];
  });
  const hasToolCard = resumeToolParts.length > 0 || workLinkToolParts.length > 0 || contactToolParts.length > 0;
  const isSettled = status !== "streaming" && status !== "submitted";
  const messageHasRenderableContent = hasRenderableContent({ hasToolCard, reasoningParts, textParts });

  // Hold finished tool cards until text has started (or the turn settles), so a turn never
  // reads card-before-text: text (or a thinking/progress indicator) always occupies the slot
  // above the card first.
  const revealToolCards = textParts.length > 0 || isSettled;
  const resumeIsPending = message.parts.some((part) => part.type === "tool-download_resume" && isToolPartPending(part));
  const workLinkIsPending = message.parts.some(
    (part) => part.type === "tool-link_work_entry" && isToolPartPending(part),
  );
  const contactIsPending = message.parts.some((part) => part.type === "tool-contact_lucien" && isToolPartPending(part));
  const toolProgressChips = [
    resumeIsPending || (resumeToolParts.length > 0 && !revealToolCards)
      ? [{ key: `${message.id}-resume-progress`, label: TOOL_PROGRESS_LABELS.download_resume }]
      : [],
    workLinkIsPending || (workLinkToolParts.length > 0 && !revealToolCards)
      ? [{ key: `${message.id}-work-link-progress`, label: TOOL_PROGRESS_LABELS.link_work_entry }]
      : [],
    contactIsPending || (contactToolParts.length > 0 && !revealToolCards)
      ? [{ key: `${message.id}-contact-progress`, label: TOOL_PROGRESS_LABELS.contact_lucien }]
      : [],
  ].flat();
  const hasToolActivity = hasToolCard || toolProgressChips.length > 0;

  return (
    <div className="space-y-4">
      <p
        className={cn(
          "font-mono text-sm tracking-wide uppercase",
          role === "assistant" ? "text-neutral-500" : "text-neutral-400",
        )}
      >
        {role === "user" ? "You" : "Poof"}
      </p>

      {reasoningParts.length > 0 ? (
        <div className="space-y-2 border-l border-neutral-950/8 pl-4">
          <p className="font-mono text-sm tracking-wide text-neutral-400 uppercase">Thinking</p>
          {reasoningParts.map((part) => (
            <p key={part.key} className="max-w-[62ch] text-sm text-pretty text-neutral-500 italic">
              {part.text}
            </p>
          ))}
        </div>
      ) : null}

      {textParts.length > 0 ? (
        <div
          className={cn(
            "max-w-none [&_p]:max-w-[62ch] [&_p]:text-pretty",
            role === "assistant"
              ? "text-[1.02rem] text-neutral-800 sm:text-[1.08rem]"
              : "text-base font-medium text-neutral-950 sm:text-[1.02rem]",
          )}
        >
          {textParts.map((part) => (
            <ChatMarkdown key={part.key} isAnimating={status === "streaming"} text={part.text} />
          ))}
        </div>
      ) : role === "assistant" && status === "streaming" && !hasToolActivity ? (
        <ChatStatusMarker label="Generating response…" />
      ) : role === "assistant" && isSettled && !messageHasRenderableContent ? (
        <p className="max-w-[62ch] text-sm text-pretty text-neutral-400 italic">
          Sorry, I didn't catch that. Mind rephrasing?
        </p>
      ) : null}

      {revealToolCards && resumeToolParts.length > 0 ? (
        <div className="space-y-2">
          {resumeToolParts.map((part) => (
            <ChatResumeCard key={part.key} filename={part.filename} url={part.url} />
          ))}
        </div>
      ) : null}

      {revealToolCards && workLinkToolParts.length > 0 ? (
        <div className="space-y-2">
          {workLinkToolParts.map((part) => (
            <ChatWorkLinkCard key={part.key} company={part.company} role={part.role} url={part.url} />
          ))}
        </div>
      ) : null}

      {revealToolCards && contactToolParts.length > 0 ? (
        <div className="space-y-2">
          {contactToolParts.map((part) => (
            <ChatContactCard key={part.key} status={part.status} />
          ))}
        </div>
      ) : null}

      {toolProgressChips.length > 0 ? (
        <div className="space-y-2">
          {toolProgressChips.map((chip) => (
            <ChatToolProgressChip key={chip.key} label={chip.label} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
