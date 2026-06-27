import { useCallback, useMemo } from 'react';
import { searchEmployees } from '@/features/employee/api/employee.api';
import { useEmployee } from '@/features/employee/hooks/use-employees';
import { AsyncSearchSelect, type AsyncSearchSelectProps } from '@/shared/components/async-search-select';

type OmitSelectProps = Omit<
  AsyncSearchSelectProps,
  'options' | 'isLoading' | 'searchPlaceholder' | 'emptyLabel' | 'loadOptions' | 'minSearchLength'
>;

export interface EmployeeSearchSelectProps extends OmitSelectProps {
  minSearchLength?: number;
}

export function EmployeeSearchSelect({
  minSearchLength = 2,
  placeholder = 'Select employee…',
  value,
  ...props
}: EmployeeSearchSelectProps) {
  const { data: selectedEmployee, isLoading: isLoadingSelected } = useEmployee(value);

  const seedOptions = useMemo(() => {
    if (!value || !selectedEmployee) return [];
    return [
      {
        value: selectedEmployee.id,
        label: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
        description: selectedEmployee.employeeNumber,
      },
    ];
  }, [selectedEmployee, value]);

  const loadOptions = useCallback(
    async (query: string) => {
      const results = await searchEmployees(query);
      return results.map((employee) => ({
        value: employee.id,
        label: `${employee.firstName} ${employee.lastName}`,
        description: employee.employeeNumber,
      }));
    },
    [],
  );

  return (
    <AsyncSearchSelect
      {...props}
      value={value}
      placeholder={placeholder}
      options={seedOptions}
      loadOptions={loadOptions}
      minSearchLength={minSearchLength}
      isLoading={Boolean(value) && isLoadingSelected && seedOptions.length === 0}
      searchPlaceholder="Search employees…"
      emptyLabel="No employees found"
    />
  );
}
