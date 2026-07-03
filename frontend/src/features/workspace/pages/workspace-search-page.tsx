import { useState } from 'react';
import { useWorkspaceSearch } from '@/features/workspace/hooks/use-workspace';
import { WorkspacePageHeader } from '@/features/workspace/components/workspace-nav';
import { Input } from '@/shared/components/ui/input';
import { EmptyState } from '@/features/workspace/components/widget-primitives';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/app.config';

export function WorkspaceSearchPage() {
  const [query, setQuery] = useState('');
  const { data, isFetching } = useWorkspaceSearch(query);

  return (
    <div className="space-y-6">
      <WorkspacePageHeader title="Search" description="Search projects, tasks, announcements, and documents." />
      <Input
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-lg"
        aria-label="Global workspace search"
      />

      {query.length < 2 ? (
        <EmptyState title="Type at least 2 characters to search" />
      ) : isFetching ? (
        <p className="text-sm text-muted-foreground">Searching...</p>
      ) : (data?.results.length ?? 0) === 0 ? (
        <EmptyState title="No results found" />
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {data?.results.map((result) => (
            <li key={`${result.type}-${result.id}`} className="px-4 py-3">
              <Link
                to={
                  result.type === 'project' ? ROUTES.workspaceProjectDetail(result.id)
                  : result.type === 'task' ? ROUTES.WORKSPACE_TASKS
                  : result.type === 'document' ? ROUTES.WORKSPACE_DOCUMENTS
                  : result.type === 'announcement' ? ROUTES.WORKSPACE_ANNOUNCEMENTS
                  : ROUTES.WORKSPACE
                }
                className="block hover:bg-muted/50"
              >
                <span className="mr-2 rounded bg-muted px-2 py-0.5 text-xs capitalize">{result.type}</span>
                <span className="font-medium">{result.title}</span>
                {result.subtitle && <span className="ml-2 text-sm text-muted-foreground">{result.subtitle}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
