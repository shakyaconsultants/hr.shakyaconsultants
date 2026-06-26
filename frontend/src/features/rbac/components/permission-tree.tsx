import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/utils/cn';
import type { PermissionRecord } from '@/features/rbac/api/rbac.api';

interface PermissionTreeProps {
  permissions: PermissionRecord[];
  selected: Set<string>;
  onToggle: (code: string) => void;
  onToggleGroup: (codes: string[], select: boolean) => void;
}

interface ModuleGroup {
  module: string;
  permissions: PermissionRecord[];
}

export function PermissionTree({ permissions, selected, onToggle, onToggleGroup }: PermissionTreeProps) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const groups = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? permissions.filter(
          (permission) =>
            permission.code.toLowerCase().includes(query) ||
            permission.name.toLowerCase().includes(query) ||
            permission.module.toLowerCase().includes(query),
        )
      : permissions;

    const byModule = new Map<string, PermissionRecord[]>();
    for (const permission of filtered) {
      const list = byModule.get(permission.module) ?? [];
      list.push(permission);
      byModule.set(permission.module, list);
    }

    return Array.from(byModule.entries())
      .map(([module, items]) => ({ module, permissions: items.sort((a, b) => a.code.localeCompare(b.code)) }))
      .sort((a, b) => a.module.localeCompare(b.module));
  }, [permissions, search]);

  function toggleModule(module: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(module)) {
        next.delete(module);
      } else {
        next.add(module);
      }
      return next;
    });
  }

  function moduleSelectionState(group: ModuleGroup): 'none' | 'partial' | 'all' {
    const codes = group.permissions.map((permission) => permission.code);
    const selectedCount = codes.filter((code) => selected.has(code)).length;
    if (selectedCount === 0) {
      return 'none';
    }
    if (selectedCount === codes.length) {
      return 'all';
    }
    return 'partial';
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search permissions..."
          className="pl-9"
        />
      </div>

      <div className="max-h-[520px] overflow-y-auto rounded-lg border">
        {groups.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No permissions match your search.</p>
        ) : (
          groups.map((group) => {
            const state = moduleSelectionState(group);
            const isOpen = expanded.has(group.module) || Boolean(search.trim());

            return (
              <div key={group.module} className="border-b last:border-0">
                <div className="flex items-center gap-2 bg-muted/30 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => toggleModule(group.module)}
                    className="rounded p-0.5 hover:bg-muted"
                    aria-label={isOpen ? 'Collapse module' : 'Expand module'}
                  >
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <input
                    type="checkbox"
                    checked={state === 'all'}
                    ref={(element) => {
                      if (element) {
                        element.indeterminate = state === 'partial';
                      }
                    }}
                    onChange={() =>
                      onToggleGroup(
                        group.permissions.map((permission) => permission.code),
                        state !== 'all',
                      )
                    }
                    className="h-4 w-4 rounded border"
                  />
                  <span className="font-medium capitalize">{group.module.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-muted-foreground">({group.permissions.length})</span>
                </div>

                {isOpen && (
                  <ul className="divide-y">
                    {group.permissions.map((permission) => (
                      <li key={permission.id}>
                        <label
                          className={cn(
                            'flex cursor-pointer items-start gap-3 px-4 py-2.5 hover:bg-muted/20',
                            selected.has(permission.code) && 'bg-primary/5',
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={selected.has(permission.code)}
                            onChange={() => onToggle(permission.code)}
                            className="mt-0.5 h-4 w-4 rounded border"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block font-mono text-xs text-primary">{permission.code}</span>
                            <span className="block text-sm">{permission.name}</span>
                            {permission.category && (
                              <span className="text-xs text-muted-foreground">{permission.category}</span>
                            )}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
