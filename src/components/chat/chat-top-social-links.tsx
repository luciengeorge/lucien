import { SOCIAL_LINKS } from "#/lib/social-links";
import { PlusSignIcon } from "@hugeicons-pro/core-solid-rounded";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSpinDelay } from "spin-delay";

import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";

function SocialLink({ className, href, label }: { className: string; href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {label}
    </a>
  );
}

function SocialLinksRow() {
  return (
    <div className="min-w-0 flex-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="inline-flex min-w-max items-center gap-2 pr-2 text-[11px] text-muted-foreground">
        {SOCIAL_LINKS.map((link, index) => (
          <div key={link.label} className="flex items-center gap-2">
            {index === 0 ? null : <span>/</span>}
            <SocialLink
              {...link}
              className="font-mono tracking-[0.12em] uppercase transition-colors hover:text-primary"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChatTopSocialLinks({ isDisabled, onClick }: { isDisabled: boolean; onClick: () => void }) {
  const isLoading = useSpinDelay(isDisabled, {
    delay: 250,
    minDuration: 200,
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
      <SocialLinksRow />

      <div className="shrink-0">
        <Button variant="link" type="button" onClick={onClick} disabled={isDisabled}>
          {isLoading ? <Spinner /> : <HugeiconsIcon icon={PlusSignIcon} />}
          New
        </Button>
      </div>
    </div>
  );
}
