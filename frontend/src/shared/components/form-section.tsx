import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

export interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <section className={cn('erp-card space-y-3 p-4', className)}>
      <div>
        <h3 className="text-body-sm font-semibold tracking-tight">{title}</h3>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export const FORM_SECTIONS = {
  BASIC: 'Basic Information',
  RELATIONSHIPS: 'Relationships',
  BUSINESS: 'Business Information',
  ADDITIONAL: 'Additional Information',
} as const;
