import type { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

export interface FilterFieldProps {
  label: string;
  children: ReactNode;
}

export function FilterField({ label, children }: FilterFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

export interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  onReset?: () => void;
  onExport?: () => void;
  exportLabel?: string;
  showArchived?: boolean;
  onShowArchivedChange?: (value: boolean) => void;
  children?: ReactNode;
  extras?: ReactNode;
  actions?: ReactNode;
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  onReset,
  onExport,
  exportLabel = 'Export',
  showArchived,
  onShowArchivedChange,
  children,
  extras,
  actions,
}: FilterBarProps) {
  return (
    <div className="rounded-lg border bg-card/50 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_repeat(4,minmax(0,1fr))]">
          <div className="sm:col-span-2 lg:col-span-1">
            <FilterField label="Search">
              <Input
                value={search}
                placeholder={searchPlaceholder}
                onChange={(event) => onSearchChange(event.target.value)}
              />
            </FilterField>
          </div>
          {children}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {extras}
          {onShowArchivedChange !== undefined ? (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={Boolean(showArchived)}
                onChange={(event) => onShowArchivedChange(event.target.checked)}
              />
              Archived
            </label>
          ) : null}
          {onReset ? (
            <Button type="button" variant="ghost" size="sm" onClick={onReset}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reset
            </Button>
          ) : null}
          {onExport ? (
            <Button type="button" variant="outline" size="sm" onClick={onExport}>
              {exportLabel}
            </Button>
          ) : null}
          {actions}
        </div>
      </div>
    </div>
  );
}
