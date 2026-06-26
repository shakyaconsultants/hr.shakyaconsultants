import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useMergedNavigation } from '@/features/configuration/hooks/use-navigation-config';
import type { ModuleNavItem } from '@/config/module-registry/types';
import type { PortalType } from '@/config/portals';
import { cn } from '@/shared/utils/cn';

function NavLinkItem({
  item,
  depth = 0,
  onNavigate,
}: {
  item: ModuleNavItem;
  depth?: number;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const hasChildren = Boolean(item.children?.length);
  const isActive =
    location.pathname === item.path ||
    location.pathname.startsWith(`${item.path}/`) ||
    item.children?.some(
      (child) => location.pathname === child.path || location.pathname.startsWith(`${child.path}/`),
    );

  if (hasChildren) {
    return (
      <li>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
          style={{ paddingLeft: `${12 + depth * 12}px` }}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        {expanded ? (
          <ul className="mt-1 space-y-1">
            {item.children?.map((child) => (
              <NavLinkItem key={child.id} item={child} depth={depth + 1} onNavigate={onNavigate} />
            ))}
          </ul>
        ) : null}
      </li>
    );
  }

  const Icon = item.icon;
  return (
    <li>
      <Link
        to={item.path}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
        style={{ paddingLeft: `${12 + depth * 12}px` }}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span>{item.label}</span>
      </Link>
    </li>
  );
}

export function PortalSidebar({ portal, onNavigate }: { portal: PortalType; onNavigate?: () => void }) {
  const groups = useMergedNavigation(portal);

  return (
    <nav className="flex-1 space-y-6 overflow-y-auto p-3 pb-24">
      {groups.map((group) => (
        <div key={group.id}>
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</p>
          <ul className="space-y-1">
            {group.items.map((item) => (
              <NavLinkItem key={item.id} item={item} onNavigate={onNavigate} />
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
