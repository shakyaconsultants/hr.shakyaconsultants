import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export interface AsyncSearchSelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface AsyncSearchSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options?: AsyncSearchSelectOption[];
  loadOptions?: (query: string) => Promise<AsyncSearchSelectOption[]>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  isLoading?: boolean;
  disabled?: boolean;
  required?: boolean;
  minSearchLength?: number;
  className?: string;
  clearable?: boolean;
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

export function AsyncSearchSelect({
  id,
  value,
  onChange,
  options = [],
  loadOptions,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyLabel = 'No results found',
  isLoading = false,
  disabled = false,
  required = false,
  minSearchLength = 0,
  className,
  clearable = true,
}: AsyncSearchSelectProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [asyncOptions, setAsyncOptions] = useState<AsyncSearchSelectOption[]>([]);
  const [asyncLoading, setAsyncLoading] = useState(false);

  const selected =
    options.find((option) => option.value === value) ??
    asyncOptions.find((option) => option.value === value);

  const staticFiltered = useMemo(() => {
    if (loadOptions) return options;
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(term) ||
        option.value.toLowerCase().includes(term) ||
        option.description?.toLowerCase().includes(term),
    );
  }, [loadOptions, options, query]);

  const visibleOptions = useMemo(() => {
    const source = loadOptions ? asyncOptions : staticFiltered;
    const merged = new Map<string, AsyncSearchSelectOption>();
    for (const option of options) {
      merged.set(option.value, option);
    }
    for (const option of source) {
      merged.set(option.value, option);
    }
    if (selected) {
      merged.set(selected.value, selected);
    }
    return Array.from(merged.values()).filter((option) => {
      if (!loadOptions) return true;
      const term = query.trim().toLowerCase();
      if (!term || term.length < minSearchLength) return true;
      return (
        option.label.toLowerCase().includes(term) ||
        option.value.toLowerCase().includes(term) ||
        option.description?.toLowerCase().includes(term)
      );
    });
  }, [asyncOptions, loadOptions, minSearchLength, options, query, selected, staticFiltered]);

  const loading = isLoading || asyncLoading;
  const canSearch = query.trim().length >= minSearchLength;

  const fetchAsync = useCallback(
    async (searchQuery: string) => {
      if (!loadOptions) return;
      if (searchQuery.trim().length < minSearchLength) {
        setAsyncOptions([]);
        return;
      }
      setAsyncLoading(true);
      try {
        const results = await loadOptions(searchQuery);
        setAsyncOptions(results);
      } finally {
        setAsyncLoading(false);
      }
    },
    [loadOptions, minSearchLength],
  );

  useEffect(() => {
    if (!open || !loadOptions) return;
    const timer = window.setTimeout(() => {
      void fetchAsync(query);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [open, query, loadOptions, fetchAsync]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
    setQuery('');
  }

  function handleClear(event: React.MouseEvent) {
    event.stopPropagation();
    onChange('');
    setQuery('');
  }

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <button
        type="button"
        id={fieldId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-required={required}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-left text-sm',
          'transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <span className={cn('truncate', !selected && 'text-muted-foreground')}>
          {selected?.label ?? placeholder}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {clearable && value ? (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear selection"
              className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={handleClear}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onChange('');
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
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg">
          <div className="border-b p-2">
            <input
              type="search"
              autoFocus
              value={query}
              placeholder={searchPlaceholder}
              onChange={(event) => setQuery(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="max-h-60 overflow-y-auto" role="listbox">
            {loading ? <SelectSkeleton /> : null}

            {!loading && loadOptions && !canSearch ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">
                Type at least {minSearchLength} character{minSearchLength === 1 ? '' : 's'} to search
              </p>
            ) : null}

            {!loading && (!loadOptions || canSearch) && visibleOptions.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">{emptyLabel}</p>
            ) : null}

            {!loading
              ? visibleOptions.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        'flex w-full items-start justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted/60',
                        isSelected && 'bg-muted/40',
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
        </div>
      ) : null}
    </div>
  );
}
