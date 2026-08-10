import { AnalyticsEvent, useAnalytics } from "#/lib/analytics";

import { ChatLedgerCard, ChatLedgerRow } from "./chat-ledger-card";

export function ChatWorkLinkCard({
  company,
  role,
  slug,
  url,
}: {
  company: string;
  role: string;
  slug: string;
  url: string;
}) {
  const { capture } = useAnalytics();

  return (
    <ChatLedgerCard label="REFERENCED">
      <ChatLedgerRow
        action={
          <a
            className="group ml-auto flex shrink-0 items-baseline gap-1.5 font-mono text-[11px] font-semibold tracking-[0.16em] text-stamp"
            href={url}
            onClick={() => {
              capture(AnalyticsEvent.workLinkClicked, { slug });
            }}
          >
            OPEN
            <span aria-hidden className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </a>
        }
        description={role}
        title={company.toUpperCase()}
      />
    </ChatLedgerCard>
  );
}
