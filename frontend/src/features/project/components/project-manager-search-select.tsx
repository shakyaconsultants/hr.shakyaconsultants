import { useMemo } from 'react';
import { useEmployee } from '@/features/employee/hooks/use-employees';
import { useProjectManagerEmployees } from '@/features/project/hooks/use-project-manager-employees';
import { AsyncSearchSelect, type AsyncSearchSelectProps } from '@/shared/components/async-search-select';

type OmitSelectProps = Omit<
  AsyncSearchSelectProps,
  'options' | 'isLoading' | 'searchPlaceholder' | 'emptyLabel' | 'loadOptions' | 'minSearchLength'
>;

export interface ProjectManagerSearchSelectProps extends OmitSelectProps {
  includeEmployeeId?: string;
}

export function ProjectManagerSearchSelect({
  placeholder = 'Select project manager…',
  value,
  includeEmployeeId,
  ...props
}: ProjectManagerSearchSelectProps) {
  const { data: managers, isLoading } = useProjectManagerEmployees();
  const preserveId = includeEmployeeId ?? value;
  const needsFallback = Boolean(preserveId) && !(managers ?? []).some((employee) => employee.id === preserveId);
  const { data: preservedEmployee, isLoading: isLoadingPreserved } = useEmployee(needsFallback ? preserveId : '');

  const options = useMemo(() => {
    const list = managers ?? [];
    const merged =
      preservedEmployee && !list.some((employee) => employee.id === preservedEmployee.id)
        ? [preservedEmployee, ...list]
        : list;

    return merged.map((employee) => ({
      value: employee.id,
      label: `${employee.firstName} ${employee.lastName}`,
      description: employee.employeeNumber,
    }));
  }, [managers, preservedEmployee]);

  return (
    <AsyncSearchSelect
      {...props}
      value={value}
      placeholder={placeholder}
      options={options}
      minSearchLength={0}
      isLoading={isLoading || (needsFallback && isLoadingPreserved)}
      searchPlaceholder="Search project managers…"
      emptyLabel="No project managers found"
    />
  );
}
