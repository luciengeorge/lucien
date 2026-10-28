import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from "#/components/ui/code-block";
import { useHighlightedCode } from "#/hooks/use-highlighted-code";
import { useIsCodeFenceIncomplete } from "streamdown";

/**
 * A fenced block in one of Poof's answers. Loaded on demand (see ChatMarkdown), so Shiki only
 * reaches visitors whose answer actually contains code. White on the grey bubble, and bled 8px into
 * its 16px padding so these 10px corners sit concentric with the bubble's 18px ones.
 */
export default function ChatCodeBlock({ code, language }: { code: string; language: string }) {
  const incomplete = useIsCodeFenceIncomplete();
  const lines = useHighlightedCode(code, language);

  return (
    <CodeBlock className="-mx-2 my-3 w-auto bg-white ring-1 ring-neutral-950/8">
      <CodeBlockHeader>
        <CodeBlockTitle className="font-mono text-xs tracking-wide text-neutral-500 uppercase">
          {language || "code"}
        </CodeBlockTitle>
        <CodeBlockActions>
          <CodeBlockCopyButton disabled={incomplete} value={code.replace(/\n$/, "")} />
        </CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent>
        {lines.map((line, index) => (
          <CodeBlockLine key={index}>{line}</CodeBlockLine>
        ))}
      </CodeBlockContent>
    </CodeBlock>
  );
}
