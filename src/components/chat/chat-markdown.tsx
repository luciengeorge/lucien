import { lazy, Suspense } from "react";
import "streamdown/styles.css";

const Streamdown = lazy(async () => {
  const module = await import("streamdown");
  return { default: module.Streamdown };
});

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

export function ChatMarkdown({ isAnimating, text }: { isAnimating: boolean; text: string }) {
  return (
    <Suspense fallback={<MarkdownFallback text={text} />}>
      <Streamdown isAnimating={isAnimating} linkSafety={linkSafety}>
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
