import { useMemo } from 'react';
import {
  useMasterDataEntity,
  useMasterDataList,
} from '@/features/organization/hooks/use-master-data';
import type { MasterEntityKey } from '@/features/organization/constants/entity-catalog';
import { AsyncSearchSelect, type AsyncSearchSelectProps } from '@/shared/components/async-search-select';
import { cn } from '@/shared/utils/cn';
import { isValidEntityId } from '@/shared/utils/entity-id.util';

type OmitSelectProps = Omit<AsyncSearchSelectProps, 'options' | 'isLoading' | 'emptyLabel'>;

export interface MasterDataSelectProps extends OmitSelectProps {
  entityKey: MasterEntityKey;
  pageSize?: number;
  /** When true, omits status filter so inactive records appear (e.g. list filters). */
  includeAllStatuses?: boolean;
  status?: string;
  labelField?: string;
  valueField?: string;
  emptyLabel?: string;
  errorLabel?: string;
  excludeIds?: string[];
}

function TriggerSkeleton({ className }: { className?: string }) {
  return <div className={cn('h-10 animate-pulse rounded-md bg-muted/70', className)} aria-hidden="true" />;
}

function normalizeSelectValue(value: string): string {
  if (!value || value === 'undefined' || value === 'null') {
    return '';
  }
  return value;
}

export function MasterDataSelect({
  entityKey,
  pageSize = 100,
  includeAllStatuses = false,
  status = 'active',
  labelField = 'name',
  valueField = 'id',
  emptyLabel = 'No records found',
  errorLabel = 'Failed to load options',
  excludeIds,
  className,
  value,
  disabled,
  ...props
}: MasterDataSelectProps) {
  const normalizedValue = normalizeSelectValue(value);

  const listParams = useMemo(
    () => ({
      page: 1,
      pageSize,
      ...(includeAllStatuses ? {} : { status }),
    }),
    [pageSize, includeAllStatuses, status],
  );

  const { data, isLoading, isError, error } = useMasterDataList(entityKey, listParams);

  const options = useMemo(() => {
    const excluded = new Set(excludeIds?.filter(isValidEntityId) ?? []);
    return (data?.items ?? [])
      .filter((record) => isValidEntityId(record.id) && !excluded.has(record.id))
      .map((record) => {
        const label = String(record[labelField] ?? record.name ?? record.code ?? record.id);
        const code = record.code ? String(record.code) : undefined;
        return {
          value: String(record[valueField] ?? record.id),
          label,
          description: code,
        };
      });
  }, [data?.items, excludeIds, labelField, valueField]);

  const valueInList = options.some((option) => option.value === normalizedValue);
  const shouldHydrateSelected = isValidEntityId(normalizedValue) && !valueInList;

  const { data: selectedRecord, isLoading: isLoadingSelected } = useMasterDataEntity(
    entityKey,
    normalizedValue,
    shouldHydrateSelected,
  );

  const mergedOptions = useMemo(() => {
    if (!shouldHydrateSelected || !selectedRecord) {
      return options;
    }

    const label = String(
      selectedRecord[labelField] ?? selectedRecord.name ?? selectedRecord.code ?? selectedRecord.id,
    );

    return [
      {
        value: normalizedValue,
        label,
        description: selectedRecord.code ? String(selectedRecord.code) : undefined,
      },
      ...options.filter((option) => option.value !== normalizedValue),
    ];
  }, [labelField, normalizedValue, options, selectedRecord, shouldHydrateSelected]);

  const loading = (isLoading && mergedOptions.length === 0) || (shouldHydrateSelected && isLoadingSelected);

  if (loading) {
    return <TriggerSkeleton className={className} />;
  }

  const apiErrorMessage =
    isError && error && typeof error === 'object' && 'error' in error
      ? String((error as { error?: { message?: string } }).error?.message ?? '')
      : '';

  return (
    <AsyncSearchSelect
      {...props}
      value={normalizedValue}
      className={className}
      options={mergedOptions}
      isLoading={loading}
      emptyLabel={isError ? apiErrorMessage || errorLabel : emptyLabel}
      disabled={disabled || isError}
    />
  );
}
