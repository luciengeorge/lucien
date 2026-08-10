import { ChatLedgerCard, ChatLedgerRow } from "./chat-ledger-card";

export function ChatContactCard({ status }: { status: "failed" | "sent" }) {
  const isSent = status === "sent";

  return (
    <ChatLedgerCard label={isSent ? "SENT" : "NOT SENT"}>
      <ChatLedgerRow
        description={isSent ? "He'll get back to you soon." : "Please try again later."}
        title={isSent ? "MESSAGE SENT TO LUCIEN" : "COULDN'T REACH LUCIEN RIGHT NOW"}
        titleClassName={isSent ? undefined : "text-stamp"}
      />
    </ChatLedgerCard>
  );
}
