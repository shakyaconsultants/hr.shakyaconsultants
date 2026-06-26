import { FormEvent, useEffect, useState } from 'react';
import type { Pipeline, PipelineStage } from '@/features/sales/api/sales.api';
import { useCreatePipeline, useUpdatePipeline } from '@/features/sales/hooks/use-sales';
import { Button } from '@/shared/components/ui/button';

interface PipelineStageEditorProps {
  pipeline?: Pipeline;
  onSaved?: () => void;
}

function emptyStage(order: number): PipelineStage {
  return { id: crypto.randomUUID(), name: '', order, probability: 0 };
}

export function PipelineStageEditor({ pipeline, onSaved }: PipelineStageEditorProps) {
  const createPipeline = useCreatePipeline();
  const updatePipeline = useUpdatePipeline();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [stages, setStages] = useState<PipelineStage[]>([emptyStage(1), emptyStage(2), emptyStage(3)]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (pipeline) {
      setName(pipeline.name);
      setDescription(pipeline.description ?? '');
      setIsDefault(pipeline.isDefault);
      setStages([...pipeline.stages].sort((a, b) => a.order - b.order));
    }
  }, [pipeline]);

  const addStage = () => {
    setStages((prev) => [...prev, emptyStage(prev.length + 1)]);
  };

  const removeStage = (index: number) => {
    setStages((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })));
  };

  const updateStage = (index: number, field: keyof PipelineStage, value: string | number) => {
    setStages((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaved(false);

    const validStages = stages.filter((s) => s.name.trim());
    if (!name.trim() || validStages.length === 0) {
      setError('Pipeline name and at least one stage are required');
      return;
    }

    try {
      const payload = { name: name.trim(), description: description || undefined, isDefault, stages: validStages };
      if (pipeline) {
        await updatePipeline.mutateAsync({ id: pipeline.id, payload });
      } else {
        await createPipeline.mutateAsync(payload);
        setName('');
        setDescription('');
        setIsDefault(false);
        setStages([emptyStage(1), emptyStage(2), emptyStage(3)]);
      }
      setSaved(true);
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save pipeline');
    }
  };

  const isPending = createPipeline.isPending || updatePipeline.isPending;

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Pipeline Name</span>
          <input className="w-full rounded-md border p-2" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Description</span>
          <input className="w-full rounded-md border p-2" value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
        Set as default pipeline
      </label>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Stages</h3>
          <Button type="button" variant="outline" size="sm" onClick={addStage}>
            Add Stage
          </Button>
        </div>
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex flex-wrap items-end gap-2 rounded border p-3">
            <label className="min-w-[140px] flex-1 space-y-1 text-sm">
              <span className="font-medium">Name</span>
              <input
                className="w-full rounded-md border p-2"
                value={stage.name}
                onChange={(e) => updateStage(index, 'name', e.target.value)}
              />
            </label>
            <label className="w-24 space-y-1 text-sm">
              <span className="font-medium">Order</span>
              <input
                type="number"
                min={1}
                className="w-full rounded-md border p-2"
                value={stage.order}
                onChange={(e) => updateStage(index, 'order', Number(e.target.value))}
              />
            </label>
            <label className="w-28 space-y-1 text-sm">
              <span className="font-medium">Probability %</span>
              <input
                type="number"
                min={0}
                max={100}
                className="w-full rounded-md border p-2"
                value={stage.probability ?? 0}
                onChange={(e) => updateStage(index, 'probability', Number(e.target.value))}
              />
            </label>
            {stages.length > 1 ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => removeStage(index)}>
                Remove
              </Button>
            ) : null}
          </div>
        ))}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {saved ? <p className="text-sm text-emerald-600">Pipeline saved successfully.</p> : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Saving...' : pipeline ? 'Update Pipeline' : 'Create Pipeline'}
      </Button>
    </form>
  );
}
