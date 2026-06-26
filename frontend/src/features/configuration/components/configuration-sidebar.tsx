import { NavLink } from 'react-router-dom';
import { Search, Settings2 } from 'lucide-react';
import { ROUTES } from '@/config/app.config';
import type { ConfigurationCatalog, ConfigurationSection } from '@/features/configuration/api/configuration.api';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/utils/cn';

interface ConfigurationSidebarProps {
  catalog?: ConfigurationCatalog;
  activeSection?: string;
  search: string;
  onSearchChange: (value: string) => void;
}

function filterSections(sections: ConfigurationSection[], search: string): ConfigurationSection[] {
  const q = search.trim().toLowerCase();
  if (!q) return sections;
  return sections.filter(
    (section) =>
      section.slug.toLowerCase().includes(q) ||
      section.label.toLowerCase().includes(q) ||
      section.description?.toLowerCase().includes(q),
  );
}

export function ConfigurationSidebar({
  catalog,
  activeSection,
  search,
  onSearchChange,
}: ConfigurationSidebarProps) {
  const sections = catalog?.sections ?? [];
  const groups = catalog?.groups ?? [{ id: 'all', label: 'All Sections', sections: sections.map((s) => s.slug) }];
  const filtered = filterSections(sections, search);
  const filteredSlugs = new Set(filtered.map((s) => s.slug));

  return (
    <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-64">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search settings..."
          className="pl-9"
        />
      </div>
      <nav className="space-y-4 overflow-y-auto rounded-lg border bg-card p-2">
        {groups.map((group) => {
          const groupSections = group.sections
            .map((slug) => sections.find((s) => s.slug === slug))
            .filter((s): s is ConfigurationSection => Boolean(s))
            .filter((s) => filteredSlugs.has(s.slug));

          if (groupSections.length === 0) return null;

          return (
            <div key={group.id}>
              <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {groupSections.map((section) => (
                  <li key={section.slug}>
                    <NavLink
                      to={ROUTES.configurationSection(section.slug)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors',
                          isActive || activeSection === section.slug
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        )
                      }
                    >
                      <Settings2 className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{section.label}</span>
                      {section.settingCount != null ? (
                        <span className="text-xs opacity-70">{section.settingCount}</span>
                      ) : null}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
