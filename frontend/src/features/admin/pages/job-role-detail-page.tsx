import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Briefcase } from 'lucide-react';
import { getEntity } from '@/features/organization/api/organization.api';
import { PageHeader } from '@/shared/components/page-header';
import { StatCard } from '@/shared/components/stat-card';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';

export function JobRoleDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data: role, isLoading } = useQuery({
    queryKey: ['organization', 'job-role', id],
    queryFn: () => getEntity('job-role', id),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return <Loading message="Loading job role..." />;
  }

  if (!role) {
    return <p className="text-destructive">Job role not found.</p>;
  }

  const responsibilities = Array.isArray(role.responsibilities) ? (role.responsibilities as string[]) : [];
  const requiredSkills = Array.isArray(role.requiredSkillIds) ? (role.requiredSkillIds as string[]) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Briefcase className="h-6 w-6 text-primary" />}
        title={role.name}
        description={String(role.description ?? 'Job role definition for recruitment mapping')}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.organizationEntity('job-role')}>All Job Roles</Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Level" value={String(role.level ?? '—')} />
        <StatCard label="Min Experience" value={`${String(role.experienceMinYears ?? 0)} yrs`} />
        <StatCard label="Max Experience" value={`${String(role.experienceMaxYears ?? '—')} yrs`} />
        <StatCard label="Status" value={role.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 font-semibold">Mappings</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Department</dt><dd>{String(role.departmentId ?? '—')}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Designation</dt><dd>{String(role.designationId ?? '—')}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Employment Type</dt><dd>{String(role.employmentTypeId ?? '—')}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Salary Grade</dt><dd>{String(role.salaryGradeId ?? '—')}</dd></div>
          </dl>
        </section>

        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 font-semibold">Recruitment</h2>
          <Button variant="outline" size="sm" asChild>
            <Link to={`${ROUTES.RECRUITMENT_CANDIDATES}?action=create`}>Create candidate for this role</Link>
          </Button>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 font-semibold">Responsibilities</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {responsibilities.length > 0 ? responsibilities.map((item) => <li key={item}>{item}</li>) : <li className="list-none pl-0 text-muted-foreground">None defined</li>}
          </ul>
        </section>
        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 font-semibold">Required Skills</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {requiredSkills.length > 0 ? requiredSkills.map((skillId) => <li key={skillId}>{skillId}</li>) : <li className="list-none pl-0 text-muted-foreground">None linked</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
