import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Palette, Compass, Shield } from 'lucide-react';
import { ROUTES } from '@/config/app.config';
import { ConfigurationSidebar } from '@/features/configuration/components/configuration-sidebar';
import { useConfigurationCatalog, useConfigurationSettings } from '@/features/configuration/hooks/use-configuration';
import { PageHeader } from '@/shared/components/page-header';
import { Loading } from '@/shared/components/loading';

const QUICK_LINKS = [
  { slug: 'company', label: 'Company Profile', icon: Building2, description: 'Legal name, timezone, currency, GST' },
  { slug: 'branding', label: 'Branding & Theme', icon: Palette, description: 'Logo, colors, portal title, footer' },
  { slug: 'security', label: 'Security', icon: Shield, description: 'Authentication, sessions, and policies' },
];

export function ConfigurationHubPage() {
  const [search, setSearch] = useState('');
  const { data: catalog, isLoading: catalogLoading } = useConfigurationCatalog();
  const { data: settingsData, isLoading: settingsLoading } = useConfigurationSettings({
    search: search.trim() || undefined,
    pageSize: 100,
  });

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return (settingsData?.items ?? []).filter(
      (s) =>
        s.key.toLowerCase().includes(q) ||
        s.group.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q),
    );
  }, [search, settingsData]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enterprise Configuration"
        description="Central hub for company settings, branding, integrations, and system policies."
      />
      <div className="flex flex-col gap-6 lg:flex-row">
        <ConfigurationSidebar catalog={catalog} search={search} onSearchChange={setSearch} />
        <div className="min-w-0 flex-1 space-y-6">
          {catalogLoading ? <Loading message="Loading configuration catalog..." /> : null}

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Quick Access
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.slug}
                  to={ROUTES.configurationSection(link.slug)}
                  className="flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
                >
                  <link.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">{link.label}</p>
                    <p className="text-sm text-muted-foreground">{link.description}</p>
                  </div>
                </Link>
              ))}
              <Link
                to={ROUTES.NAVIGATION_MANAGER}
                className="flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
              >
                <Compass className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Navigation Manager</p>
                  <p className="text-sm text-muted-foreground">Enable, disable, and reorder sidebar menus</p>
                </div>
              </Link>
            </div>
          </section>

          {search.trim() ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Search Results
              </h2>
              {settingsLoading ? <Loading message="Searching settings..." /> : null}
              {!settingsLoading && searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground">No settings match &ldquo;{search}&rdquo;.</p>
              ) : null}
              <ul className="divide-y rounded-lg border bg-card">
                {searchResults.map((setting) => (
                  <li key={setting.key} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-mono font-medium">{setting.key}</p>
                      <p className="text-muted-foreground">{setting.description ?? setting.group}</p>
                    </div>
                    <Link
                      to={ROUTES.configurationSection(setting.group)}
                      className="shrink-0 text-primary hover:underline"
                    >
                      Open section
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {!search.trim() && catalog ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                All Sections ({catalog.sections.length})
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {catalog.sections.map((section) => (
                  <Link
                    key={section.slug}
                    to={ROUTES.configurationSection(section.slug)}
                    className="rounded-lg border bg-card px-4 py-3 text-sm hover:bg-muted/30"
                  >
                    <p className="font-medium">{section.label}</p>
                    {section.description ? (
                      <p className="mt-1 line-clamp-2 text-muted-foreground">{section.description}</p>
                    ) : null}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
