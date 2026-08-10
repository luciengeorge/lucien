import { AnalyticsEvent, useAnalytics } from "#/lib/analytics";

import { ChatLedgerCard, ChatLedgerRow } from "./chat-ledger-card";

export function ChatResumeCard({ filename, url }: { filename: string; url: string }) {
  const { capture } = useAnalytics();

  return (
    <ChatLedgerCard label="ATTACHED">
      <ChatLedgerRow
        action={
          <a
            aria-label={`Download ${filename}`}
            className="group ml-auto flex shrink-0 items-baseline gap-1.5 font-mono text-[11px] font-semibold tracking-[0.16em] text-stamp"
            download={filename}
            href={url}
            onClick={() => {
              capture(AnalyticsEvent.resumeDownloaded, { filename, source: "resume_card" });
            }}
            rel="noreferrer"
            target="_blank"
          >
            DOWNLOAD
            <span aria-hidden className="transition-transform group-hover:translate-y-0.5">
              ↓
            </span>
          </a>
        }
        meta="PDF"
        title="RESUME"
      />
    </ChatLedgerCard>
  );
}
