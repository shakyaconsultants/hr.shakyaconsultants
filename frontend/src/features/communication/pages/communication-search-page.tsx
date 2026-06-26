import { FormEvent, useState } from 'react';
import { Search } from 'lucide-react';
import type { SearchType } from '@/features/communication/api/communication.api';
import { useCommunicationSearch } from '@/features/communication/hooks/use-communication';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { EmptyState } from '@/features/workspace/components/widget-primitives';

const SEARCH_TYPES: SearchType[] = ['messages', 'announcements', 'channels', 'attachments', 'mentions'];

export function CommunicationSearchPage() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [types, setTypes] = useState<SearchType[]>(SEARCH_TYPES);

  const { data, isLoading, isFetching } = useCommunicationSearch(
    { q: submittedQuery, types, limit: 30 },
    Boolean(submittedQuery.trim()),
  );

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmittedQuery(query.trim());
  };

  const toggleType = (type: SearchType) => {
    setTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2 text-primary">
          <Search className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Communication Search</h1>
        </div>
        <p className="text-sm text-muted-foreground">Search messages, announcements, channels, attachments, and mentions.</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-wrap gap-2">
        <input
          className="min-w-[240px] flex-1 rounded-md border px-3 py-2 text-sm"
          placeholder="Search communication..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" disabled={!query.trim() || isFetching}>
          Search
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {SEARCH_TYPES.map((type) => (
          <Button
            key={type}
            size="sm"
            variant={types.includes(type) ? 'default' : 'outline'}
            onClick={() => toggleType(type)}
          >
            {type}
          </Button>
        ))}
      </div>

      {isLoading || isFetching ? <Loading message="Searching..." /> : null}

      {submittedQuery && data ? (
        <div className="space-y-6">
          {SEARCH_TYPES.map((type) => {
            const items = data.results[type];
            if (!items?.length) return null;
            return (
              <section key={type} className="rounded-lg border bg-card p-6">
                <h2 className="mb-4 font-semibold capitalize">{type}</h2>
                <ul className="divide-y">
                  {items.map((item) => (
                    <li key={item.id} className="py-3 text-sm">
                      {'title' in item && item.title ? (
                        <p className="font-medium">{item.title}</p>
                      ) : null}
                      {'content' in item && item.content ? (
                        <p className="text-muted-foreground">{item.content}</p>
                      ) : null}
                      {'fileName' in item && item.fileName ? (
                        <p className="font-medium">{item.fileName}</p>
                      ) : null}
                      {'channelSubtype' in item && item.channelSubtype ? (
                        <span className="text-xs text-muted-foreground">{item.channelSubtype}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
          {SEARCH_TYPES.every((type) => !data.results[type]?.length) ? (
            <EmptyState title="No results" description={`No matches for "${submittedQuery}"`} />
          ) : null}
        </div>
      ) : !submittedQuery ? (
        <EmptyState title="Enter a search query" description="Search across all communication content." />
      ) : null}
    </div>
  );
}
