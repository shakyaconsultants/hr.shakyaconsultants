import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, GripVertical } from 'lucide-react';
import { MODULE_REGISTRY } from '@/config/module-registry';
import { ROUTES } from '@/config/app.config';
import type { NavigationItemConfig } from '@/features/configuration/api/configuration.api';
import {
  useNavigationConfig,
  useUpdateNavigationConfig,
} from '@/features/configuration/hooks/use-configuration';
import { PageHeader } from '@/shared/components/page-header';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { useAuthStore } from '@/shared/stores/app.store';

interface FlatNavItem {
  id: string;
  label: string;
  path: string;
  groupLabel: string;
  groupId: string;
}

function flattenNavItems(): FlatNavItem[] {
  const items: FlatNavItem[] = [];
  for (const mod of MODULE_REGISTRY) {
    for (const group of mod.navigation) {
      for (const item of group.items) {
        items.push({
          id: item.id,
          label: item.label,
          path: item.path,
          groupLabel: group.label,
          groupId: group.id,
        });
        if (item.children) {
          for (const child of item.children) {
            items.push({
              id: child.id,
              label: child.label,
              path: child.path,
              groupLabel: group.label,
              groupId: group.id,
            });
          }
        }
      }
    }
  }
  return items;
}

export function NavigationManagerPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManage = hasPermission('settings.manage');
  const baseItems = useMemo(() => flattenNavItems(), []);
  const { data: navConfig, isLoading } = useNavigationConfig({ fetchFresh: true });
  const updateMutation = useUpdateNavigationConfig();

  const [draftItems, setDraftItems] = useState<NavigationItemConfig[] | null>(null);
  const [dirty, setDirty] = useState(false);

  const mergedItems = useMemo(() => {
    const overrideMap = new Map((navConfig?.items ?? []).map((item) => [item.id, item]));
    const source = draftItems ?? baseItems.map((item, index) => {
      const override = overrideMap.get(item.id);
      return {
        id: item.id,
        enabled: override?.enabled ?? true,
        order: override?.order ?? index,
        label: override?.label ?? item.label,
        path: override?.path ?? item.path,
        groupId: item.groupId,
      };
    });
    return [...source].sort((a, b) => a.order - b.order);
  }, [baseItems, navConfig, draftItems]);

  const itemMeta = useMemo(() => new Map(baseItems.map((i) => [i.id, i])), [baseItems]);

  function updateItem(id: string, patch: Partial<NavigationItemConfig>) {
    setDraftItems((prev) => {
      const current =
        prev ??
        baseItems.map((item, index) => {
          const override = navConfig?.items.find((o) => o.id === item.id);
          return {
            id: item.id,
            enabled: override?.enabled ?? true,
            order: override?.order ?? index,
            label: override?.label ?? item.label,
            path: override?.path ?? item.path,
            groupId: item.groupId,
          };
        });
      return current.map((item) => (item.id === id ? { ...item, ...patch } : item));
    });
    setDirty(true);
  }

  function moveItem(id: string, direction: -1 | 1) {
    const index = mergedItems.findIndex((i) => i.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= mergedItems.length) return;
    const reordered = [...mergedItems];
    const [removed] = reordered.splice(index, 1);
    reordered.splice(target, 0, removed);
    setDraftItems(reordered.map((item, order) => ({ ...item, order })));
    setDirty(true);
  }

  async function handleSave() {
    await updateMutation.mutateAsync(mergedItems);
    setDraftItems(null);
    setDirty(false);
  }

  return (
    <div className="space-y-6">
      <Link
        to={ROUTES.CONFIGURATION}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Configuration Hub
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Navigation Manager"
          description="Control sidebar visibility, labels, and ordering across enterprise portals."
        />
        {canManage ? (
          <Button disabled={!dirty || updateMutation.isPending} onClick={() => void handleSave()}>
            Save navigation
          </Button>
        ) : null}
      </div>
      {isLoading ? <Loading message="Loading navigation config..." /> : null}
      {!isLoading ? (
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-3 border-b bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Order</span>
            <span>Menu Item</span>
            <span>Label Override</span>
            <span>Visible</span>
            <span>Actions</span>
          </div>
          <ul className="divide-y">
            {mergedItems.map((item) => {
              const meta = itemMeta.get(item.id);
              return (
                <li
                  key={item.id}
                  className="grid grid-cols-[auto_1fr_1fr_auto_auto] items-center gap-3 px-4 py-3 text-sm"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{meta?.label ?? item.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {meta?.groupLabel} · {meta?.path ?? item.path}
                    </p>
                  </div>
                  <Input
                    value={item.label ?? ''}
                    disabled={!canManage}
                    onChange={(e) => updateItem(item.id, { label: e.target.value })}
                    placeholder={meta?.label}
                  />
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    disabled={!canManage}
                    onChange={(e) => updateItem(item.id, { enabled: e.target.checked })}
                    className="h-4 w-4 justify-self-center"
                  />
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled={!canManage} onClick={() => moveItem(item.id, -1)}>
                      ↑
                    </Button>
                    <Button variant="outline" size="sm" disabled={!canManage} onClick={() => moveItem(item.id, 1)}>
                      ↓
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
