import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { Building2, ChevronRight } from 'lucide-react';
import { useMasterDataList } from '@/features/organization/hooks/use-master-data';
import { useEmployees } from '@/features/employee/hooks/use-employees';
import { PageHeader } from '@/shared/components/page-header';
import { Loading } from '@/shared/components/loading';
import { ROUTES } from '@/config/app.config';
import { getCompany } from '@/features/organization/api/organization.api';
import { useQuery } from '@tanstack/react-query';

export function OrganizationChartPage() {
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['organization', 'company'],
    queryFn: getCompany,
  });
  const { data: branches, isLoading: branchesLoading } = useMasterDataList('branch', { page: 1, pageSize: 50, status: 'active' });
  const { data: departments, isLoading: departmentsLoading } = useMasterDataList('department', { page: 1, pageSize: 100, status: 'active' });
  const { data: designations, isLoading: designationsLoading } = useMasterDataList('designation', { page: 1, pageSize: 100, status: 'active' });
  const { data: employees, isLoading: employeesLoading } = useEmployees({ page: 1, pageSize: 100, status: 'active' });

  const tree = useMemo(() => {
    const branchList = branches?.items ?? [];
    const departmentList = departments?.items ?? [];
    const designationList = designations?.items ?? [];
    const employeeList = employees?.items ?? [];

    return branchList.map((branch) => ({
      branch,
      departments: departmentList
        .filter((department) => department.branchId === branch.id || !department.branchId)
        .map((department) => ({
          department,
          designations: designationList.map((designation) => ({
            designation,
            employees: employeeList.filter(
              (employee) =>
                employee.departmentId === department.id && employee.designationId === designation.id,
            ),
          })),
        })),
    }));
  }, [branches?.items, departments?.items, designations?.items, employees?.items]);

  if (companyLoading || branchesLoading || departmentsLoading || designationsLoading || employeesLoading) {
    return <Loading message="Building organization chart..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Building2 className="h-6 w-6 text-primary" />}
        title="Organization Chart"
        description="Navigate company → branch → department → designation → employee."
        actions={
          <Link to={ROUTES.ORGANIZATION_SETUP} className="text-sm font-medium text-primary hover:underline">
            Run setup wizard
          </Link>
        }
      />

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-6 text-center">
          <p className="text-lg font-bold">{String(company?.name ?? 'Company')}</p>
          <p className="text-sm text-muted-foreground">{String(company?.code ?? '')}</p>
        </div>

        <div className="space-y-6">
          {tree.map(({ branch, departments: branchDepartments }) => (
            <section key={branch.id} className="rounded-lg border p-4">
              <h2 className="mb-3 flex items-center gap-2 font-semibold">
                <ChevronRight className="h-4 w-4" />
                Branch: {branch.name}
              </h2>
              <div className="space-y-4 pl-4">
                {branchDepartments.map(({ department, designations: deptDesignations }) => (
                  <div key={department.id} className="rounded border p-3">
                    <h3 className="font-medium">Department: {department.name}</h3>
                    <p className="mb-2 text-xs text-muted-foreground">
                      Employees: {String(department.employeeCount ?? 0)}
                    </p>
                    <div className="space-y-2 pl-3">
                      {deptDesignations.map(({ designation, employees: deptEmployees }) =>
                        deptEmployees.length > 0 ? (
                          <div key={designation.id}>
                            <p className="text-sm font-medium">{designation.name}</p>
                            <ul className="mt-1 space-y-1 pl-3 text-sm text-muted-foreground">
                              {deptEmployees.map((employee) => (
                                <li key={employee.id}>
                                  <Link to={ROUTES.employeeDetail(employee.id)} className="hover:text-primary">
                                    {employee.firstName} {employee.lastName}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null,
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
