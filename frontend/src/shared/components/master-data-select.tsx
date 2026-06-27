import { useMemo } from 'react';
import { useMasterDataList } from '@/features/organization/hooks/use-master-data';
import type { MasterEntityKey } from '@/features/organization/constants/entity-catalog';
import { AsyncSearchSelect, type AsyncSearchSelectProps } from '@/shared/components/async-search-select';
import { cn } from '@/shared/utils/cn';

type OmitSelectProps = Omit<AsyncSearchSelectProps, 'options' | 'isLoading' | 'emptyLabel'>;

export interface MasterDataSelectProps extends OmitSelectProps {
  entityKey: MasterEntityKey;
  pageSize?: number;
  status?: string;
  labelField?: string;
  valueField?: string;
  emptyLabel?: string;
}

function TriggerSkeleton({ className }: { className?: string }) {
  return <div className={cn('h-10 animate-pulse rounded-md bg-muted/70', className)} aria-hidden="true" />;
}

export function MasterDataSelect({
  entityKey,
  pageSize = 200,
  status = 'active',
  labelField = 'name',
  valueField = 'id',
  emptyLabel = 'No records found',
  className,
  value,
  ...props
}: MasterDataSelectProps) {
  const { data, isLoading } = useMasterDataList(entityKey, { page: 1, pageSize, status });

  const options = useMemo(
    () =>
      (data?.items ?? []).map((record) => {
        const label = String(record[labelField] ?? record.name ?? record.code ?? record.id);
        const code = record.code ? String(record.code) : undefined;
        return {
          value: String(record[valueField] ?? record.id),
          label,
          description: code,
        };
      }),
    [data?.items, labelField, valueField],
  );

  if (isLoading && options.length === 0) {
    return <TriggerSkeleton className={className} />;
  }

  return (
    <AsyncSearchSelect
      {...props}
      value={value}
      className={className}
      options={options}
      isLoading={isLoading}
      emptyLabel={emptyLabel}
    />
  );
}
