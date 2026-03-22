import type { ReactNode } from 'react';

import { PostHogProvider as BasePostHogProvider } from '@posthog/react';
import posthog from 'posthog-js';

const posthogKey = import.meta.env.VITE_POSTHOG_KEY;

if (typeof window !== 'undefined' && posthogKey) {
  posthog.init(posthogKey, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'always',
    capture_pageview: true,
    defaults: '2025-11-30',
    autocapture: true,
  });
}

interface PostHogProviderProps {
  children: ReactNode;
}

export default function PostHogProvider({ children }: PostHogProviderProps) {
  if (!posthogKey) {
    return <>{children}</>;
  }

  return <BasePostHogProvider client={posthog}>{children}</BasePostHogProvider>;
}
