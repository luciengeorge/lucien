import { HOMEPAGE_INTRO_FALLBACK } from "#/lib/chat-intro";

import { ChatComposerBlock } from "./chat-composer-block";
import { entryItemClassName } from "./chat.utils";

const noop = () => {};
const noopAsync = async () => {};

/**
 * Streamed-SSR fallback for the homepage while the conversation intro resolves.
 * Renders the static intro text immediately (so FCP/LCP paint real content) and
 * mirrors ChatConversation's layout so the swap to the live chat causes no shift.
 */
export function ChatBootstrap() {
  return (
    <section className="flex min-h-0 grow overflow-hidden bg-background">
      <div className="flex min-h-0 w-full grow flex-col gap-2 sm:gap-5">
        <div className="relative min-h-0 grow overflow-hidden">
          <div className="mx-auto w-full max-w-3xl px-4 pb-20 sm:px-6 sm:pb-24">
            <ol className="space-y-0">
              <li className={entryItemClassName(true)}>
                <div className="space-y-4">
                  <p className="font-mono text-sm tracking-wide text-neutral-500 uppercase">Poof</p>
                  <p className="max-w-[62ch] text-sm text-pretty text-neutral-700">{HOMEPAGE_INTRO_FALLBACK}</p>
                </div>
              </li>
            </ol>
          </div>
        </div>

        <div className="sticky bottom-0 z-10">
          <div className="relative mx-auto w-full max-w-3xl px-4 sm:px-6">
            <div className="bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/75">
              <ChatComposerBlock isBusy onResumeRequest={noop} onSend={noopAsync} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
