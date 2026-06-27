import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import type { AsyncSearchSelectOption } from '@/shared/components/async-search-select';
import {
  DropdownPanel,
  dropdownListClassName,
  dropdownOptionClassName,
  dropdownOptionSelectedClassName,
} from '@/shared/components/dropdown-panel';

export interface AsyncMultiSearchSelectProps {
  id?: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: AsyncSearchSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

function SelectSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-2" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-9 animate-pulse rounded-md bg-muted/70" />
      ))}
    </div>
  );
}

export function AsyncMultiSearchSelect({
  id,
  value,
  onChange,
  options,
  placeholder = 'Select items…',
  searchPlaceholder = 'Search…',
  emptyLabel = 'No results found',
  isLoading = false,
  disabled = false,
  className,
}: AsyncMultiSearchSelectProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedLabels = useMemo(
    () =>
      value
        .map((itemId) => options.find((option) => option.value === itemId)?.label)
        .filter(Boolean) as string[],
    [options, value],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(term) ||
        option.value.toLowerCase().includes(term) ||
        option.description?.toLowerCase().includes(term),
    );
  }, [options, query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggleOption(optionValue: string) {
    if (value.includes(optionValue)) {
      onChange(value.filter((item) => item !== optionValue));
      return;
    }
    onChange([...value, optionValue]);
  }

  function handleClear(event: React.MouseEvent) {
    event.stopPropagation();
    onChange([]);
  }

  const summary =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length <= 2
        ? selectedLabels.join(', ')
        : `${selectedLabels.length} selected`;

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <button
        type="button"
        id={fieldId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={cn(
          'flex min-h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-left text-sm',
          'transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <span className={cn('line-clamp-2', selectedLabels.length === 0 && 'text-muted-foreground')}>{summary}</span>
        <span className="flex shrink-0 items-center gap-1">
          {value.length > 0 ? (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear selection"
              className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={handleClear}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onChange([]);
                }
              }}
            >
              <X className="h-3.5 w-3.5" />
            </span>
          ) : null}
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </span>
      </button>

      {open ? (
        <DropdownPanel className="w-full">
          <div className="border-b border-border bg-popover p-2">
            <input
              type="search"
              autoFocus
              value={query}
              placeholder={searchPlaceholder}
              onChange={(event) => setQuery(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className={cn(dropdownListClassName, 'max-h-60')} role="listbox">
            {isLoading ? <SelectSkeleton /> : null}
            {!isLoading && filtered.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">{emptyLabel}</p>
            ) : null}
            {!isLoading
              ? filtered.map((option) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => toggleOption(option.value)}
                      className={cn(
                        dropdownOptionClassName,
                        'items-start justify-between gap-2 px-3 py-2.5',
                        isSelected && dropdownOptionSelectedClassName,
                      )}
                    >
                      <span>
                        <span className="block font-medium">{option.label}</span>
                        {option.description ? (
                          <span className="block text-xs text-muted-foreground">{option.description}</span>
                        ) : null}
                      </span>
                      {isSelected ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : null}
                    </button>
                  );
                })
              : null}
          </div>
        </DropdownPanel>
      ) : null}
    </div>
  );
}
