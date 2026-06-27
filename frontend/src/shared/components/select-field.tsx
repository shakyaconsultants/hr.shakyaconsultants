import type { ReactNode } from 'react';
import { FormLabel } from '@/shared/components/form-label';

export interface SelectFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}

export function SelectField({ label, htmlFor, required, hint, children }: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <FormLabel htmlFor={htmlFor}>
        {label}
        {required ? ' *' : ''}
      </FormLabel>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
