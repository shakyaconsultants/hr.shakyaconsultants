import { cn } from '@/shared/utils/cn';
import type { LabelHTMLAttributes } from 'react';

export function FormLabel({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('mb-1.5 block text-sm font-medium text-foreground', className)}
      {...props}
    />
  );
}
