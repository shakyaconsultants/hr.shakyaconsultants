import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router-dom';

/** Creates a React Router lazy route entry for code-split module loading. */
export function lazyRoute<M extends Record<string, unknown>>(
  factory: () => Promise<M>,
  exportName: keyof M & string,
): Pick<RouteObject, 'lazy'> {
  return {
    lazy: async () => {
      const module = await factory();
      return { Component: module[exportName] as ComponentType<object> };
    },
  };
}
