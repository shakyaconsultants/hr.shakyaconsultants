import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useMergedNavigation } from '@/app/hooks/use-merged-navigation';
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
            'flex w-full items-center gap-3 rounded px-3 py-2 text-body-sm font-medium transition-colors',
            isActive
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-foreground',
          )}
          style={{ paddingLeft: `${12 + depth * 12}px` }}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        {expanded ? (
          <ul className="mt-1 space-y-0.5">
            {item.children?.map((child) => (
              <NavLinkItem key={child.id} item={child} depth={depth + 1} onNavigate={onNavigate} />
            ))}
          </ul>
        ) : null}
      </li>
    );
  }

  const Icon = item.icon;
  const isCurrent =
    location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

  return (
    <li>
      <Link
        to={item.path}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 rounded px-3 py-2 text-body-sm font-medium transition-colors',
          isCurrent
            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
            : 'text-sidebar-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-foreground',
        )}
        style={{ paddingLeft: `${12 + depth * 12}px` }}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span>{item.label}</span>
      </Link>
    </li>
  );
}

export function PortalSidebar({
  portal,
  onNavigate,
}: {
  portal: PortalType;
  onNavigate?: () => void;
}) {
  const groups = useMergedNavigation(portal);

  return (
    <nav className="space-y-5 p-3">
      {groups.map((group) => (
        <div key={group.id}>
          <p className="mb-1.5 px-2 text-label-caps text-sidebar-muted-foreground">{group.label}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <NavLinkItem key={item.id} item={item} onNavigate={onNavigate} />
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
