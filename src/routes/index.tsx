import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { Streamdown } from 'streamdown';
import 'streamdown/styles.css';

import { ChatInput } from '#/components/chat-input';
import { ScrollArea } from '#/components/ui/scroll-area';
import { Separator } from '#/components/ui/separator';
import { useMockStream } from '#/hooks/use-mock-stream';

export const Route = createFileRoute('/')({ component: ChatPage });

function ChatPage() {
  const { messages, streamingContent, isStreaming, startIntro, sendMessage } =
    useMockStream();
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    const timer = setTimeout(() => startIntro(), 600);
    return () => clearTimeout(timer);
  }, [startIntro]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [streamingContent, messages]);

  const showInput = messages.length > 0 && !isStreaming;

  return (
    <div className='flex min-h-svh flex-col'>
      <ScrollArea className='flex-1'>
        <div className='mx-auto max-w-2xl px-6 pt-[25vh] pb-40'>
          <div className='space-y-6'>
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === 'user' ? (
                  <>
                    <Separator className='my-8 opacity-30' />
                    <p className='font-sans text-sm font-medium text-primary'>
                      {msg.content}
                    </p>
                    <Separator className='my-8 opacity-30' />
                  </>
                ) : (
                  <div className='narrative-text font-sans text-base leading-relaxed text-foreground prose prose-zinc max-w-none [&_strong]:font-semibold [&_strong]:text-primary [&_p]:mb-4'>
                    <Streamdown>{msg.content}</Streamdown>
                  </div>
                )}
              </div>
            ))}

            {streamingContent ? (
              <div className='narrative-text font-sans text-base leading-relaxed text-foreground prose prose-zinc max-w-none [&_strong]:font-semibold [&_strong]:text-primary [&_p]:mb-4'>
                <Streamdown animated isAnimating={isStreaming} caret='circle'>
                  {streamingContent}
                </Streamdown>
              </div>
            ) : null}
          </div>

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <ChatInput
        onSend={sendMessage}
        disabled={isStreaming}
        visible={showInput}
      />
    </div>
  );
}
