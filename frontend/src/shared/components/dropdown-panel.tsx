import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

/** Opaque floating panel for comboboxes, time/date pickers, and search selects. */
export const dropdownPanelClassName =
  'absolute z-[100] mt-1 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-lg ring-1 ring-border/50';

export const dropdownListClassName = 'dropdown-scroll overflow-y-auto bg-popover';

export const dropdownOptionClassName =
  'flex w-full text-left text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none';

export const dropdownOptionSelectedClassName = 'bg-muted font-medium';

export interface DropdownPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function DropdownPanel({ className, children, ...props }: DropdownPanelProps) {
  return (
    <div className={cn(dropdownPanelClassName, className)} {...props}>
      {children}
    </div>
  );
}
