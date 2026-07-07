import type { ComponentType, ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PageSkeleton } from '@/shared/components/page-skeleton';

const defaultHydrateFallback = (
  <div className="flex min-h-[40vh] items-center justify-center p-6">
    <PageSkeleton />
  </div>
);

/** Creates a React Router lazy route entry for code-split module loading. */
export function lazyRoute<M extends Record<string, unknown>>(
  factory: () => Promise<M>,
  exportName: keyof M & string,
  hydrateFallback: ReactNode = defaultHydrateFallback,
): Pick<RouteObject, 'lazy' | 'hydrateFallbackElement'> {
  return {
    hydrateFallbackElement: hydrateFallback,
    lazy: async () => {
      const module = await factory();
      return { Component: module[exportName] as ComponentType<object> };
    },
  };
}
