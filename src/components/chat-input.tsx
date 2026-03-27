import { ArrowUp01Icon } from '@hugeicons-pro/core-stroke-rounded';
import { HugeiconsIcon } from '@hugeicons/react';
import { useState } from 'react';

import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { cn } from '#/lib/utils';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  visible?: boolean;
}

export function ChatInput({ onSend, disabled, visible }: ChatInputProps) {
  const [value, setValue] = useState('');

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 transition-all duration-700',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
      )}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
    >
      <div className='mx-auto max-w-2xl px-6 pb-8 pt-16 bg-gradient-to-t from-background via-background/95 to-transparent'>
        <div className='flex items-center gap-2'>
          <Input
            type='text'
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            disabled={disabled}
            placeholder='Ask me anything...'
            className='h-10 flex-1 rounded-full border-foreground/8 bg-muted/40 px-4 text-sm font-sans placeholder:text-muted-foreground/50'
          />
          <Button
            size='icon'
            variant='ghost'
            onClick={submit}
            disabled={disabled || !value.trim()}
            className='size-10 shrink-0 rounded-full'
          >
            <HugeiconsIcon icon={ArrowUp01Icon} className='size-4' />
          </Button>
        </div>
      </div>
    </div>
  );
}
