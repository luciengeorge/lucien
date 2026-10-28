import { moodOf } from "#/lib/chat/mood";
import { WORK_META } from "#/lib/content/work-meta";
import { cleanVoiceText } from "#/lib/strip-audio-tags";
import { cn } from "#/lib/utils";
import { AudioWave01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { match } from "ts-pattern";
import { z } from "zod";

import type { ChatMessage, ChatStatus } from "./chat.types";
import type { PoofMarkState, PoofMoodCue } from "./poof-mark";

import { ChatContactCard } from "./chat-contact-card";
import { ChatMarkdown } from "./chat-markdown";
import { ChatReasoning } from "./chat-reasoning";
import { ChatResumeCard } from "./chat-resume-card";
import { PoofStatus } from "./chat-status-marker";
import { isVoiceMessage } from "./chat-voice.utils";
import { ChatWorkLinkCard } from "./chat-work-link-card";
import { TOOL_PROGRESS_LABELS } from "./chat.constants";
import { PoofMark } from "./poof-mark";

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

/** How long Poof's face stays beside a finished answer: long enough to react to it, then it leaves. */
export const FACE_LINGER_MS = 2500;

/** True while `working`, and for a moment after it stops. Never for a reply that was already done when it mounted. */
function useLingering(working: boolean): boolean {
  const [lingering, setLingering] = useState(working);
  if (working && !lingering) setLingering(true);

  useEffect(() => {
    if (working) return;
    const timer = setTimeout(() => setLingering(false), FACE_LINGER_MS);
    return () => clearTimeout(timer);
  }, [working]);

  return working || lingering;
}

function workEntryCompany(part: ChatMessage["parts"][number]): string | undefined {
  if (!("input" in part) || typeof part.input !== "object" || part.input === null || !("slug" in part.input)) {
    return undefined;
  }
  const { slug } = part.input;
  return WORK_META.find((entry) => entry.slug === slug)?.company;
}

function toolProgressLabelOf(part: ChatMessage["parts"][number]): string | undefined {
  return match(part.type)
    .with("tool-download_resume", () => TOOL_PROGRESS_LABELS.download_resume)
    .with("tool-link_work_entry", () => {
      const company = workEntryCompany(part);
      return company ? `Pulling up ${company}…` : TOOL_PROGRESS_LABELS.link_work_entry;
    })
    .with("tool-contact_lucien", () => TOOL_PROGRESS_LABELS.contact_lucien)
    .otherwise(() => undefined);
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

export function ChatTimelineMessage({
  isActive,
  message,
  status,
  wasStopped = false,
}: {
  /** True only for the last/streaming assistant message. Past turns always reveal cards immediately. */
  isActive: boolean;
  message: ChatMessage;
  status: ChatStatus;
  /** The visitor stopped this reply: it is marked "Stopped", and Poof settles without the "answer landed" celebration. */
  wasStopped?: boolean;
}) {
  const role = message.role === "user" ? "user" : "assistant";
  // Only a reply streamed in this visit has a mood: it is not saved, so call transcripts and
  // replies from before a reload leave the face as it was.
  const mood = moodOf(message.metadata);
  const moodCue = useMemo<PoofMoodCue | undefined>(() => (mood ? { mood } : undefined), [mood]);
  // gpt-5.6-luna emits a reasoning part whose text is empty. A "Thinking" header over nothing
  // reads as a stuck status and outlives the answer, so only text that can actually be shown counts.
  const reasoningParts = message.parts.flatMap((part, index) =>
    match(part)
      .with({ type: "reasoning" }, (reasoningPart) =>
        reasoningPart.text.trim().length > 0
          ? [
              {
                key: `${message.id}-reasoning-${index}`,
                text: reasoningPart.text,
              },
            ]
          : [],
      )
      .otherwise(() => []),
  );
  const isThinking =
    isActive &&
    status === "streaming" &&
    message.parts.some((part) => part.type === "reasoning" && part.state === "streaming");
  const textParts = message.parts.flatMap((part, index) =>
    match(part)
      .with({ type: "text" }, (textPart) => [
        {
          key: `${message.id}-text-${index}`,
          text: isVoiceMessage(message) ? cleanVoiceText(textPart.text, role) : textPart.text,
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
        slug: part.output.slug,
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
  const reduceMotion = useReducedMotion();
  const messageHasRenderableContent = hasRenderableContent({ hasToolCard, reasoningParts, textParts });

  // Hold finished tool cards until the answer has finished, so they never sit under a bubble that
  // is still growing and get pushed down line by line. Before any text, the progress label beside
  // the face stands in for a held card. Only the actively streaming turn holds; `status` is global
  // to every message in the timeline, so past (non-active) turns must always reveal immediately and
  // never show progress, regardless of what the global status is doing for a newer turn.
  const revealToolCards = isSettled || !isActive;
  const isWriting = textParts.length > 0;
  // The latest tool still on the go, counting one whose card is held back: if several are, only
  // the newest says what Poof is doing, so the face never carries a stack of labels.
  const toolProgressLabel = isActive
    ? message.parts
        .flatMap((part) => {
          const label = toolProgressLabelOf(part);
          const isHeld = !revealToolCards && !isWriting && "state" in part && part.state === "output-available";
          return label && (isToolPartPending(part) || isHeld) ? [label] : [];
        })
        .at(-1)
    : undefined;

  // Poof's face only shows while it works on the latest answer, then stays a moment to react to
  // it before leaving. Past turns, answers that were already there, and the user's own messages
  // have none. A tool in progress outranks streaming text, so the face and its label never tell
  // two different stories about the same moment.
  const isLatestAssistantTurn = role === "assistant" && isActive;
  const isWorkingOrLingering = useLingering(isLatestAssistantTurn && !isSettled);
  const showsFace = isLatestAssistantTurn && (isWorkingOrLingering || status === "error");
  // Every message gets the same global status, so a stopped turn is told apart by `wasStopped` alone.
  const isStoppedReply = role === "assistant" && wasStopped;
  const markState: PoofMarkState =
    status === "error"
      ? "confused"
      : isSettled
        ? "idle"
        : toolProgressLabel
          ? "working"
          : textParts.length > 0
            ? "writing"
            : "thinking";
  const faceLabel =
    toolProgressLabel ??
    (isActive && status === "streaming" && textParts.length === 0 && !hasToolCard && !isStoppedReply
      ? "Thinking…"
      : undefined);
  const showsFallback = role === "assistant" && isSettled && !messageHasRenderableContent && !isStoppedReply;
  const isUser = role === "user";
  const bubbleClassName = cn(
    "max-w-full min-w-0 px-4 py-2.5 text-[15px] leading-relaxed wrap-break-word sm:text-base",
    isUser
      ? "rounded-2xl rounded-tr-md bg-primary text-white"
      : "rounded-2xl rounded-tl-md bg-neutral-100 text-neutral-800 [&_ol]:pl-5 [&_ul]:pl-5",
  );

  return (
    <div
      className={cn(
        "flex w-full max-w-[85%] flex-col gap-2 sm:max-w-[75%]",
        isUser ? "ml-auto items-end" : "items-start",
      )}
      data-speaker={role}
    >
      <span className="sr-only">{isUser ? "You said" : "Poof said"}</span>

      {reasoningParts.length > 0 ? <ChatReasoning parts={reasoningParts} thinking={isThinking} /> : null}

      {textParts.length > 0 ? (
        <div className={bubbleClassName} data-slot="chat-bubble">
          {textParts.map((part) =>
            isUser ? (
              <p key={part.key} className="whitespace-pre-wrap">
                {part.text}
              </p>
            ) : (
              <ChatMarkdown key={part.key} isAnimating={status === "streaming"} text={part.text} />
            ),
          )}
        </div>
      ) : showsFallback ? (
        <div className={bubbleClassName} data-slot="chat-bubble">
          <p className="text-pretty text-neutral-500 italic">Sorry, I didn't catch that. Mind rephrasing?</p>
        </div>
      ) : null}

      {isVoiceMessage(message) ? (
        <span className="inline-flex items-center gap-1 px-1 text-xs text-neutral-400">
          <HugeiconsIcon icon={AudioWave01Icon} size={12} />
          Voice
        </span>
      ) : null}

      {revealToolCards && hasToolCard ? (
        <div className="w-full space-y-2">
          {[
            ...resumeToolParts.map((part) => <ChatResumeCard key={part.key} filename={part.filename} url={part.url} />),
            ...workLinkToolParts.map((part) => (
              <ChatWorkLinkCard
                key={part.key}
                company={part.company}
                role={part.role}
                slug={part.slug}
                url={part.url}
              />
            )),
            ...contactToolParts.map((part) => <ChatContactCard key={part.key} status={part.status} />),
          ].map((card, index) => (
            <motion.div
              key={card.key}
              animate={{ opacity: 1, y: 0 }}
              // Only the answer that just finished brings its cards in; history renders as it is.
              initial={isActive && !reduceMotion ? { opacity: 0, y: 6 } : false}
              transition={{ delay: index * 0.05, duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            >
              {card}
            </motion.div>
          ))}
        </div>
      ) : null}

      {isStoppedReply ? <p className="px-1 text-xs text-neutral-400">Stopped</p> : null}

      <AnimatePresence>
        {showsFace ? (
          <div key="poof" className="flex items-center">
            <PoofMark entrance={false} interrupted={wasStopped} mood={moodCue} state={markState} />
            {faceLabel ? <PoofStatus label={faceLabel} /> : null}
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
