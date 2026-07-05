import { useQuery } from '@tanstack/react-query';
import { fetchAllEmployees, type EmployeeRecord } from '@/features/employee/api/employee.api';
import { listDesignations } from '@/features/organization/designations/designation.api';
import { isProjectManagerDesignation } from '@/features/project/constants/project-manager-designations';

async function fetchProjectManagerEmployees(): Promise<EmployeeRecord[]> {
  const { items: designations } = await listDesignations({ pageSize: 100, status: 'active' });
  const designationIds = designations
    .filter((designation) => isProjectManagerDesignation(designation.name))
    .map((designation) => designation.id);

  if (designationIds.length === 0) {
    return [];
  }

  const batches = await Promise.all(
    designationIds.map((designationId) => fetchAllEmployees({ status: 'active', designationId })),
  );

  const byId = new Map<string, EmployeeRecord>();
  for (const batch of batches) {
    for (const employee of batch) {
      byId.set(employee.id, employee);
    }
  }

  return [...byId.values()].sort((a, b) => {
    const last = a.lastName.localeCompare(b.lastName);
    if (last !== 0) return last;
    return a.firstName.localeCompare(b.firstName);
  });
}

export function useProjectManagerEmployees() {
  return useQuery({
    queryKey: ['employees', 'project-managers'],
    queryFn: fetchProjectManagerEmployees,
    refetchOnMount: true,
  });
}
