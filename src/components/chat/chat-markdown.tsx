import type { ComponentProps } from "react";

import { lazy, Suspense } from "react";
import "streamdown/styles.css";

const Streamdown = lazy(async () => {
  const module = await import("streamdown");
  return { default: module.Streamdown };
});

const ChatCodeBlock = lazy(() => import("./chat-code-block"));

/** Every host the content links to. Anything else Poof writes still gets Streamdown's confirm step. */
const TRUSTED_HOSTS = new Set(["github.com", "linkedin.com", "instagram.com", "x.com", "ico.org.uk"]);

export function isTrustedLink(href: string): boolean {
  let url: URL;
  try {
    url = new URL(href, window.location.origin);
  } catch {
    return false;
  }
  if (url.origin === window.location.origin) return true;
  return url.protocol === "https:" && TRUSTED_HOSTS.has(url.hostname.replace(/^www\./, ""));
}

const linkSafety = { enabled: true, onLinkCheck: isTrustedLink };

/** Streamdown marks fenced code with `data-block`; inline code stays inline. */
function MarkdownCode({ children, className, node: _node, ...props }: ComponentProps<"code"> & { node?: unknown }) {
  if (!("data-block" in props)) {
    return <code className="rounded bg-neutral-950/5 px-1.5 py-0.5 font-mono text-[0.9em]">{children}</code>;
  }
  const code = String(children);
  const language = /language-(\S+)/.exec(className ?? "")?.[1] ?? "";
  return (
    <Suspense fallback={<pre className="my-4 overflow-x-auto font-mono text-sm">{code}</pre>}>
      <ChatCodeBlock code={code} language={language} />
    </Suspense>
  );
}

const components = { code: MarkdownCode };

export function ChatMarkdown({ isAnimating, text }: { isAnimating: boolean; text: string }) {
  return (
    <Suspense fallback={<MarkdownFallback text={text} />}>
      <Streamdown components={components} isAnimating={isAnimating} linkSafety={linkSafety}>
        {text}
      </Streamdown>
    </Suspense>
  );
}

function MarkdownFallback({ text }: { text: string }) {
  return text
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>);
}
