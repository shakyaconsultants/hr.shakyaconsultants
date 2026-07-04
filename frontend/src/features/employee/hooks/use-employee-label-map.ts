import { useMemo } from 'react';
import { useEmployees } from '@/features/employee/hooks/use-employees';

export function useEmployeeLabelMap(pageSize = 500) {
  const { data } = useEmployees({ pageSize, status: 'active' });

  return useMemo(() => {
    const map = new Map<string, string>();
    for (const employee of data?.items ?? []) {
      map.set(employee.id, `${employee.firstName} ${employee.lastName}`.trim() || employee.employeeNumber);
    }
    return map;
  }, [data?.items]);
}

export function formatEmployeeLabel(map: Map<string, string>, employeeId: string): string {
  return map.get(employeeId) ?? employeeId.slice(0, 8);
}
