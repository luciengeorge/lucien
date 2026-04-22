import { lazy, Suspense } from "react";

import "streamdown/styles.css";

const Streamdown = lazy(async () => {
  const module = await import("streamdown");
  return { default: module.Streamdown };
});

export function ChatMarkdown({ isAnimating, text }: { isAnimating: boolean; text: string }) {
  return (
    <Suspense fallback={<MarkdownFallback text={text} />}>
      <Streamdown isAnimating={isAnimating}>{text}</Streamdown>
    </Suspense>
  );
}

function MarkdownFallback({ text }: { text: string }) {
  return text
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>);
}
