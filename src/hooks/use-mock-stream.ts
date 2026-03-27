import { useCallback, useRef, useState } from 'react';

const INTRO = `Hi, I'm Lucien.

I'm a software engineer based in Paris. I build things for the web — from early-stage products to developer tools. I care deeply about craft, clean interfaces, and making technology feel effortless.

Previously, I taught hundreds of people to code at Le Wagon. These days I'm focused on building products that matter.

**Ask me anything** — about my work, my projects, my stack, or what I'm excited about right now.`;

const RESPONSES: Record<string, string> = {
  default: `That's a great question. I'd love to tell you more — this part of the conversation will be powered by AI soon. For now, feel free to explore the intro above or ask something else.`,
};

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

const WORD_DELAY = 35;
const WORD_VARIANCE = 20;

export function useMockStream() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const cancelRef = useRef(false);

  const streamText = useCallback(async (text: string) => {
    setIsStreaming(true);
    setStreamingContent('');
    cancelRef.current = false;

    const words = text.split(/(\s+)/);
    let accumulated = '';

    for (const word of words) {
      if (cancelRef.current) break;
      accumulated += word;
      setStreamingContent(accumulated);
      const delay = WORD_DELAY + Math.random() * WORD_VARIANCE;
      await new Promise((r) => setTimeout(r, delay));
    }

    setMessages((prev) => [...prev, { role: 'assistant', content: text }]);
    setStreamingContent('');
    setIsStreaming(false);
  }, []);

  const startIntro = useCallback(() => {
    streamText(INTRO);
  }, [streamText]);

  const sendMessage = useCallback(
    (text: string) => {
      if (isStreaming) return;
      setMessages((prev) => [...prev, { role: 'user', content: text }]);
      const response = RESPONSES.default;
      setTimeout(() => streamText(response), 400);
    },
    [isStreaming, streamText],
  );

  return {
    messages,
    streamingContent,
    isStreaming,
    startIntro,
    sendMessage,
  };
}
