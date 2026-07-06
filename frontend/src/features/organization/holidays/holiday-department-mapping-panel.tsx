import { useMemo } from 'react';
import { useMasterDataList } from '@/features/organization/hooks/use-master-data';
import { useQuery } from '@tanstack/react-query';
import { fetchAllHolidayModules } from '@/features/organization/holidays/holiday-module.api';
import { holidayModuleTypeLabel } from '@/features/organization/holidays/holiday-module.constants';
import { DataTable } from '@/shared/components/data-table';

export function HolidayDepartmentMappingPanel() {
  const { data: departments, isLoading: departmentsLoading } = useMasterDataList('department', {
    pageSize: 200,
    status: 'active',
  });
  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ['holiday-modules-mapping'],
    queryFn: () => fetchAllHolidayModules({ status: 'active' }),
  });

  const moduleByDepartment = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const module of modules) {
      const deptIds = module.departmentIds ?? [];
      if (deptIds.length === 0) {
        continue;
      }
      for (const deptId of deptIds) {
        const existing = map.get(deptId) ?? [];
        existing.push(module.name);
        map.set(deptId, existing);
      }
    }
    return map;
  }, [modules]);

  const companyWideModules = useMemo(
    () => modules.filter((module) => (module.departmentIds ?? []).length === 0),
    [modules],
  );

  const rows = useMemo(() => {
    return (departments?.items ?? []).map((dept) => ({
      id: dept.id,
      name: dept.name,
      code: dept.code,
      modules: moduleByDepartment.get(dept.id)?.join(', ') ?? '—',
      inheritsCompanyWide: companyWideModules.map((m) => m.name).join(', ') || '—',
    }));
  }, [departments?.items, moduleByDepartment, companyWideModules]);

  const columns = [
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Department' },
    {
      key: 'modules',
      header: 'Assigned Modules',
      render: (row: (typeof rows)[number]) => (
        <span className="text-sm">
          {row.modules === '—' ? 'None (company-wide only)' : row.modules}
        </span>
      ),
    },
    {
      key: 'inheritsCompanyWide',
      header: 'Company-wide Modules',
      render: (row: (typeof rows)[number]) => (
        <span className="text-sm text-muted-foreground">{row.inheritsCompanyWide}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Department Holiday Mapping</h3>
        <p className="text-sm text-muted-foreground">
          Employees inherit holidays from modules assigned to their department, plus any
          company-wide modules.
        </p>
      </div>

      {companyWideModules.length > 0 ? (
        <div className="rounded-lg border bg-muted/20 p-4 text-sm">
          <p className="font-medium">Company-wide modules (all departments)</p>
          <ul className="mt-2 list-disc pl-5">
            {companyWideModules.map((module) => (
              <li key={module.id}>
                {module.name} — {holidayModuleTypeLabel(module.moduleType)}
                {module.calendarYear ? ` (${module.calendarYear})` : ''}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border">
        <DataTable columns={columns} data={rows} isLoading={departmentsLoading || modulesLoading} />
      </div>
    </div>
  );
}
