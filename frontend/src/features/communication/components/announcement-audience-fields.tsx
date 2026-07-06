import { useMemo } from 'react';
import type { AnnouncementAudience } from '@/features/communication/api/communication.api';
import { useMasterDataList } from '@/features/organization/hooks/use-master-data';
import { useAllEmployees } from '@/features/employee/hooks/use-employees';
import { SelectField } from '@/shared/components/select-field';
import { MasterDataSelect } from '@/shared/components/master-data-select';
import { Button } from '@/shared/components/ui/button';
import { Select } from '@/shared/components/ui/select';

export const ANNOUNCEMENT_AUDIENCE_OPTIONS: Array<{ value: AnnouncementAudience; label: string }> =
  [
    { value: 'all', label: 'Everyone in company' },
    { value: 'department', label: 'By department' },
    { value: 'role', label: 'By designation' },
    { value: 'department_role', label: 'By department & designation' },
    { value: 'branch', label: 'By branch' },
    { value: 'team', label: 'Specific employees / team' },
    { value: 'project', label: 'By project' },
  ];

interface AnnouncementAudienceFieldsProps {
  targetAudience: AnnouncementAudience;
  targetIds: string[];
  secondaryTargetIds: string[];
  onAudienceChange: (audience: AnnouncementAudience) => void;
  onTargetIdsChange: (ids: string[]) => void;
  onSecondaryTargetIdsChange: (ids: string[]) => void;
  lockAudience?: AnnouncementAudience;
}

function MultiSelectChips({
  label,
  ids,
  nameMap,
  onRemove,
  onAdd,
  entityKey,
  placeholder,
}: {
  label: string;
  ids: string[];
  nameMap: Map<string, string>;
  onRemove: (id: string) => void;
  onAdd: (id: string) => void;
  entityKey: 'department' | 'designation' | 'branch';
  placeholder: string;
}) {
  return (
    <SelectField label={label} required>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {ids.length === 0 ? (
            <span className="text-xs text-muted-foreground">None selected — add below</span>
          ) : (
            ids.map((id) => (
              <Button
                key={id}
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => onRemove(id)}
              >
                {nameMap.get(id) ?? id} ×
              </Button>
            ))
          )}
        </div>
        <MasterDataSelect
          entityKey={entityKey}
          value=""
          onChange={(next) => {
            if (next && !ids.includes(next)) {
              onAdd(next);
            }
          }}
          placeholder={placeholder}
        />
      </div>
    </SelectField>
  );
}

export function AnnouncementAudienceFields({
  targetAudience,
  targetIds,
  secondaryTargetIds,
  onAudienceChange,
  onTargetIdsChange,
  onSecondaryTargetIdsChange,
  lockAudience,
}: AnnouncementAudienceFieldsProps) {
  const audience = lockAudience ?? targetAudience;

  const { data: departments } = useMasterDataList('department', {
    pageSize: 200,
    status: 'active',
  });
  const { data: designations } = useMasterDataList('designation', {
    pageSize: 200,
    status: 'active',
  });
  const { data: branches } = useMasterDataList('branch', { pageSize: 100, status: 'active' });
  const { data: employees } = useAllEmployees();

  const departmentMap = useMemo(
    () => new Map((departments?.items ?? []).map((item) => [item.id, item.name])),
    [departments?.items],
  );
  const designationMap = useMemo(
    () => new Map((designations?.items ?? []).map((item) => [item.id, item.name])),
    [designations?.items],
  );
  const branchMap = useMemo(
    () => new Map((branches?.items ?? []).map((item) => [item.id, item.name])),
    [branches?.items],
  );
  const employeeMap = useMemo(
    () =>
      new Map(
        (employees ?? []).map((item) => [item.id, `${item.firstName} ${item.lastName}`.trim()]),
      ),
    [employees],
  );

  function toggleId(ids: string[], id: string, onChange: (next: string[]) => void) {
    onChange(ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
  }

  return (
    <div className="space-y-4 sm:col-span-2">
      {!lockAudience ? (
        <SelectField label="Audience" htmlFor="announcement-audience" required>
          <Select
            id="announcement-audience"
            value={targetAudience}
            onChange={(event) => {
              onAudienceChange(event.target.value as AnnouncementAudience);
              onTargetIdsChange([]);
              onSecondaryTargetIdsChange([]);
            }}
          >
            {ANNOUNCEMENT_AUDIENCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </SelectField>
      ) : (
        <p className="text-sm text-muted-foreground">
          Audience: <span className="font-medium text-foreground">Team members</span>
        </p>
      )}

      {audience === 'department' ? (
        <MultiSelectChips
          label="Departments"
          ids={targetIds}
          nameMap={departmentMap}
          onRemove={(id) => toggleId(targetIds, id, onTargetIdsChange)}
          onAdd={(id) => onTargetIdsChange([...targetIds, id])}
          entityKey="department"
          placeholder="Add department…"
        />
      ) : null}

      {audience === 'role' ? (
        <MultiSelectChips
          label="Designations"
          ids={targetIds}
          nameMap={designationMap}
          onRemove={(id) => toggleId(targetIds, id, onTargetIdsChange)}
          onAdd={(id) => onTargetIdsChange([...targetIds, id])}
          entityKey="designation"
          placeholder="Add designation…"
        />
      ) : null}

      {audience === 'department_role' ? (
        <>
          <MultiSelectChips
            label="Departments"
            ids={targetIds}
            nameMap={departmentMap}
            onRemove={(id) => toggleId(targetIds, id, onTargetIdsChange)}
            onAdd={(id) => onTargetIdsChange([...targetIds, id])}
            entityKey="department"
            placeholder="Add department…"
          />
          <MultiSelectChips
            label="Designations"
            ids={secondaryTargetIds}
            nameMap={designationMap}
            onRemove={(id) => toggleId(secondaryTargetIds, id, onSecondaryTargetIdsChange)}
            onAdd={(id) => onSecondaryTargetIdsChange([...secondaryTargetIds, id])}
            entityKey="designation"
            placeholder="Add designation…"
          />
          <p className="text-xs text-muted-foreground">
            Only employees in the selected departments who also hold one of the selected
            designations will receive this announcement.
          </p>
        </>
      ) : null}

      {audience === 'branch' ? (
        <MultiSelectChips
          label="Branches"
          ids={targetIds}
          nameMap={branchMap}
          onRemove={(id) => toggleId(targetIds, id, onTargetIdsChange)}
          onAdd={(id) => onTargetIdsChange([...targetIds, id])}
          entityKey="branch"
          placeholder="Add branch…"
        />
      ) : null}

      {audience === 'team' ? (
        <>
          <SelectField label="Employees" required>
            <div className="mb-2 flex flex-wrap gap-2">
              {targetIds.length === 0 ? (
                <span className="text-xs text-muted-foreground">Add employees below</span>
              ) : (
                targetIds.map((id) => (
                  <Button
                    key={id}
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => onTargetIdsChange(targetIds.filter((item) => item !== id))}
                  >
                    {employeeMap.get(id) ?? id} ×
                  </Button>
                ))
              )}
            </div>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value=""
              onChange={(event) => {
                const id = event.target.value;
                if (id && !targetIds.includes(id)) {
                  onTargetIdsChange([...targetIds, id]);
                }
              }}
            >
              <option value="">Select employee…</option>
              {(employees ?? []).map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName}
                </option>
              ))}
            </select>
          </SelectField>
          <p className="text-xs text-muted-foreground">
            For managers, leave empty to automatically include your direct reports when published.
          </p>
        </>
      ) : null}

      {audience === 'all' ? (
        <p className="text-sm text-muted-foreground">
          This announcement will be sent to all active employees in the company.
        </p>
      ) : null}
    </div>
  );
}
