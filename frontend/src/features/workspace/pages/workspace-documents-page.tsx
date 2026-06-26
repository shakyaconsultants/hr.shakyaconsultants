import { useState } from 'react';
import { useMyDocuments, useDownloadDocument } from '@/features/workspace/hooks/use-workspace';
import { WorkspaceNav, WorkspacePageHeader } from '@/features/workspace/components/workspace-nav';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { EmptyState } from '@/features/workspace/components/widget-primitives';

export function WorkspaceDocumentsPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useMyDocuments({ search: search || undefined });
  const download = useDownloadDocument();

  if (isLoading) return <Loading message="Loading documents..." />;

  return (
    <div className="space-y-6">
      <WorkspacePageHeader title="My Documents" description="Secure document center with preview and download." />
      <WorkspaceNav />
      <Input placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      {(data?.items.length ?? 0) === 0 ? (
        <EmptyState title="No documents" description="Uploaded documents will appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((doc) => {
            const isImage = doc.mimeType && String(doc.mimeType).startsWith('image/');
            const isExpired = Boolean(doc.isExpired);
            const expiresSoon = Boolean(doc.expiresSoon);
            return (
              <article key={String(doc.id)} className="rounded-lg border bg-card p-4">
                {isImage && doc.fileUrl ? (
                  <img src={String(doc.fileUrl)} alt="" className="mb-3 h-32 w-full rounded object-cover" />
                ) : (
                  <div className="mb-3 flex h-32 items-center justify-center rounded bg-muted text-muted-foreground">Document</div>
                )}
                <h3 className="font-medium">{String(doc.fileName)}</h3>
                <p className="text-xs text-muted-foreground">{String(doc.documentType)} · v{String(doc.version)}</p>
                {doc.expiryDate ? (
                  <p className={`mt-1 text-xs ${isExpired ? 'text-destructive' : expiresSoon ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    {isExpired ? 'Expired' : expiresSoon ? 'Expires soon' : 'Valid'} — {new Date(String(doc.expiryDate)).toLocaleDateString()}
                  </p>
                ) : null}
                <Button
                  size="sm"
                  className="mt-3"
                  variant="outline"
                  onClick={() => download.mutate(String(doc.id), { onSuccess: (result) => window.open(result.fileUrl, '_blank') })}
                >
                  Download
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
