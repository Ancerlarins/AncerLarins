import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { createElement } from 'react';

afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js Image component (use createElement instead of JSX)
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, priority, ...rest } = props;
    return createElement('img', rest);
  },
}));

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, ...props }: { children: unknown; [key: string]: unknown }) => {
    return createElement('a', props, children);
  },
}));
