import { useMemo } from 'react';
import { useAllEmployees } from '@/features/employee/hooks/use-employees';

export function useEmployeeLabelMap() {
  const { data } = useAllEmployees({ status: 'active' });

  return useMemo(() => {
    const map = new Map<string, string>();
    for (const employee of data ?? []) {
      map.set(employee.id, `${employee.firstName} ${employee.lastName}`.trim() || employee.employeeNumber);
    }
    return map;
  }, [data]);
}

export function formatEmployeeLabel(map: Map<string, string>, employeeId: string): string {
  return map.get(employeeId) ?? employeeId.slice(0, 8);
}
